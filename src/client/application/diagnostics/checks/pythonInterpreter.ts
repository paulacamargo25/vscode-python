// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// eslint-disable-next-line max-classes-per-file
import { inject, injectable } from 'inversify';
import { DiagnosticSeverity, l10n } from 'vscode';
import '../../../common/extensions';
import * as path from 'path';
import { IDisposableRegistry, IInterpreterPathService, Resource } from '../../../common/types';
import { IInterpreterService } from '../../../interpreter/contracts';
import { IServiceContainer } from '../../../ioc/types';
import { BaseDiagnostic, BaseDiagnosticsService } from '../base';
import { IDiagnosticsCommandFactory } from '../commands/types';
import { DiagnosticCodes } from '../constants';
import { DiagnosticCommandPromptHandlerServiceId, MessageCommandPrompt } from '../promptHandler';
import {
    DiagnosticScope,
    IDiagnostic,
    IDiagnosticCommand,
    IDiagnosticHandlerService,
    IDiagnosticMessageOnCloseHandler,
} from '../types';
import { Common } from '../../../common/utils/localize';
import { Commands } from '../../../common/constants';
import { ICommandManager, IWorkspaceService } from '../../../common/application/types';
import { sendTelemetryEvent } from '../../../telemetry';
import { EventName } from '../../../telemetry/constants';
import { IExtensionSingleActivationService } from '../../../activation/types';
import { cache } from '../../../common/utils/decorators';
import { noop } from '../../../common/utils/misc';

const messages = {
    [DiagnosticCodes.NoPythonInterpretersDiagnostic]: l10n.t(
        'No Python interpreter is selected. Please select a Python interpreter to enable features such as IntelliSense, linting, and debugging.',
    ),
    [DiagnosticCodes.InvalidPythonInterpreterDiagnostic]: l10n.t(
        'An Invalid Python interpreter is selected{0}, please try changing it to enable features such as IntelliSense, linting, and debugging.',
    ),
};

export class InvalidPythonInterpreterDiagnostic extends BaseDiagnostic {
    constructor(
        code: DiagnosticCodes.NoPythonInterpretersDiagnostic | DiagnosticCodes.InvalidPythonInterpreterDiagnostic,
        resource: Resource,
        workspaceService: IWorkspaceService,
        scope = DiagnosticScope.WorkspaceFolder,
    ) {
        let formatArg = '';
        if (
            workspaceService.workspaceFile &&
            workspaceService.workspaceFolders &&
            workspaceService.workspaceFolders?.length > 1
        ) {
            // Specify folder name in case of multiroot scenarios
            const folder = workspaceService.getWorkspaceFolder(resource);
            if (folder) {
                formatArg = ` ${l10n.t('for workspace')} ${path.basename(folder.uri.fsPath)}`;
            }
        }
        super(code, messages[code].format(formatArg), DiagnosticSeverity.Error, scope, resource, undefined, 'always');
    }
}

export const InvalidPythonInterpreterServiceId = 'InvalidPythonInterpreterServiceId';

@injectable()
export class InvalidPythonInterpreterService extends BaseDiagnosticsService
    implements IExtensionSingleActivationService {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: true };

    constructor(
        @inject(IServiceContainer) serviceContainer: IServiceContainer,
        @inject(IDisposableRegistry) disposableRegistry: IDisposableRegistry,
    ) {
        super(
            [DiagnosticCodes.NoPythonInterpretersDiagnostic, DiagnosticCodes.InvalidPythonInterpreterDiagnostic],
            serviceContainer,
            disposableRegistry,
            false,
        );
    }

    public async activate(): Promise<void> {
        const commandManager = this.serviceContainer.get<ICommandManager>(ICommandManager);
        this.disposableRegistry.push(
            commandManager.registerCommand(Commands.TriggerEnvironmentSelection, (resource: Resource) =>
                this.triggerEnvSelectionIfNecessary(resource),
            ),
        );
        const interpreterService = this.serviceContainer.get<IInterpreterService>(IInterpreterService);
        this.disposableRegistry.push(
            interpreterService.onDidChangeInterpreterConfiguration((e) =>
                commandManager.executeCommand(Commands.TriggerEnvironmentSelection, e).then(noop, noop),
            ),
        );
    }

    // eslint-disable-next-line class-methods-use-this
    public async diagnose(_resource: Resource): Promise<IDiagnostic[]> {
        return [];
    }

    public async _manualDiagnose(resource: Resource): Promise<IDiagnostic[]> {
        const workspaceService = this.serviceContainer.get<IWorkspaceService>(IWorkspaceService);
        const interpreterService = this.serviceContainer.get<IInterpreterService>(IInterpreterService);
        const hasInterpreters = await interpreterService.hasInterpreters();
        const interpreterPathService = this.serviceContainer.get<IInterpreterPathService>(IInterpreterPathService);
        const isInterpreterSetToDefault = interpreterPathService.get(resource) === 'python';

        if (!hasInterpreters && isInterpreterSetToDefault) {
            return [
                new InvalidPythonInterpreterDiagnostic(
                    DiagnosticCodes.NoPythonInterpretersDiagnostic,
                    resource,
                    workspaceService,
                    DiagnosticScope.Global,
                ),
            ];
        }

        const currentInterpreter = await interpreterService.getActiveInterpreter(resource);
        if (!currentInterpreter) {
            return [
                new InvalidPythonInterpreterDiagnostic(
                    DiagnosticCodes.InvalidPythonInterpreterDiagnostic,
                    resource,
                    workspaceService,
                ),
            ];
        }
        return [];
    }

    public async triggerEnvSelectionIfNecessary(resource: Resource): Promise<boolean> {
        const diagnostics = await this._manualDiagnose(resource);
        if (!diagnostics.length) {
            return true;
        }
        this.handle(diagnostics).ignoreErrors();
        return false;
    }

    @cache(1000, true) // This is to handle throttling of multiple events.
    protected async onHandle(diagnostics: IDiagnostic[]): Promise<void> {
        if (diagnostics.length === 0) {
            return;
        }
        const messageService = this.serviceContainer.get<IDiagnosticHandlerService<MessageCommandPrompt>>(
            IDiagnosticHandlerService,
            DiagnosticCommandPromptHandlerServiceId,
        );
        await Promise.all(
            diagnostics.map(async (diagnostic) => {
                if (!this.canHandle(diagnostic)) {
                    return;
                }
                const commandPrompts = this.getCommandPrompts(diagnostic);
                const onClose = getOnCloseHandler(diagnostic);
                await messageService.handle(diagnostic, { commandPrompts, message: diagnostic.message, onClose });
            }),
        );
    }

    private getCommandPrompts(diagnostic: IDiagnostic): { prompt: string; command?: IDiagnosticCommand }[] {
        const commandFactory = this.serviceContainer.get<IDiagnosticsCommandFactory>(IDiagnosticsCommandFactory);
        return [
            {
                prompt: Common.selectPythonInterpreter,
                command: commandFactory.createCommand(diagnostic, {
                    type: 'executeVSCCommand',
                    options: Commands.Set_Interpreter,
                }),
            },
        ];
    }
}

function getOnCloseHandler(diagnostic: IDiagnostic): IDiagnosticMessageOnCloseHandler | undefined {
    if (diagnostic.code === DiagnosticCodes.NoPythonInterpretersDiagnostic) {
        return (response?: string) => {
            sendTelemetryEvent(EventName.PYTHON_NOT_INSTALLED_PROMPT, undefined, {
                selection: response ? 'Download' : 'Ignore',
            });
        };
    }
    return undefined;
}
