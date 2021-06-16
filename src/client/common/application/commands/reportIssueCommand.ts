// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import { inject, injectable } from 'inversify';
import { IExtensionSingleActivationService } from '../../../activation/types';
import { ICommandManager, IWorkspaceService } from '../types';
import { EXTENSION_ROOT_DIR } from '../../../constants';
import { IInterpreterService, IInterpreterVersionService } from '../../../interpreter/contracts';
import { identifyEnvironment } from '../../../pythonEnvironments/common/environmentIdentifier';
import { getPythonOutputChannelContent } from '../../../logging';
import { Commands } from '../../constants';
import { IConfigurationService, IPythonSettings } from '../../types';

/**
 * Allows the user to report an issue related to the Python extension using our template.
 */
@injectable()
export class ReportIssueCommandHandler implements IExtensionSingleActivationService {
    constructor(
        @inject(ICommandManager) private readonly commandManager: ICommandManager,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
        @inject(IInterpreterService) private readonly interpreterService: IInterpreterService,
        @inject(IInterpreterVersionService) private readonly interpreterVersionService: IInterpreterVersionService,
        @inject(IConfigurationService) protected readonly configurationService: IConfigurationService,
    ) {}

    public async activate(): Promise<void> {
        this.commandManager.registerCommand(Commands.ReportIssue, this.openReportIssue, this);
    }

    private argSettingsPath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_user_settings.json');

    private templatePath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_template.md');

    public async openReportIssue(): Promise<void> {
        const settings: IPythonSettings = this.configurationService.getSettings();
        const argSettings = JSON.parse(await fs.readFile(this.argSettingsPath, 'utf8'));
        let userSettings = '';
        const keys: [keyof IPythonSettings] = Object.keys(settings) as [keyof IPythonSettings];
        keys.forEach((property) => {
            const argSetting = argSettings[property];
            if (argSetting) {
                if (typeof argSetting === 'boolean') {
                    userSettings = userSettings.concat('\n', property, ': ', JSON.stringify(settings[property]), '\n');
                } else if (typeof argSetting === 'object') {
                    userSettings = userSettings.concat('\n', property, '\n');
                    const argSettingsDict = settings[property];
                    if (typeof argSettingsDict === 'object') {
                        Object.keys(argSetting).forEach((item) => {
                            const prop = argSetting[item];
                            if (prop) {
                                userSettings = userSettings.concat(
                                    '\t',
                                    item,
                                    ': ',
                                    JSON.stringify(argSettingsDict[item]),
                                    '\n',
                                );
                            }
                        });
                    }
                }
            }
        });
        const pythonLogs = await getPythonOutputChannelContent();
        const template = await fs.readFile(this.templatePath, 'utf8');
        const interpreterPath = (await this.interpreterService.getActiveInterpreter())?.path || 'not-selected';
        const pythonVersion = await this.interpreterVersionService.getVersion(interpreterPath, '');
        const languageServer =
            this.workspaceService.getConfiguration('python').get<string>('languageServer') || 'Not Found';
        const virtualEnv = await identifyEnvironment(interpreterPath);
        console.log(template.format(pythonVersion, virtualEnv, languageServer, pythonLogs, userSettings));
        this.commandManager.executeCommand('workbench.action.openIssueReporter', {
            extensionId: 'ms-python.python',
            issueBody: template.format(pythonVersion, virtualEnv, languageServer, pythonLogs, userSettings),
        });
    }
}
