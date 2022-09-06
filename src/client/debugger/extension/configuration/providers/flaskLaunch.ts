// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable } from 'inversify';
import * as path from 'path';
import * as fs from 'fs';
import { WorkspaceFolder } from 'vscode';
import { DebugConfigStrings } from '../../../../common/utils/localize';
import { MultiStepInput } from '../../../../common/utils/multiStepInput';
import { sendTelemetryEvent } from '../../../../telemetry';
import { EventName } from '../../../../telemetry/constants';
import { DebuggerTypeName } from '../../../constants';
import { LaunchRequestArguments } from '../../../types';
import { DebugConfigurationState, DebugConfigurationType, IDebugConfigurationProvider } from '../../types';

@injectable()
export class FlaskLaunchDebugConfigurationProvider implements IDebugConfigurationProvider {
    public isSupported(debugConfigurationType: DebugConfigurationType): boolean {
        return debugConfigurationType === DebugConfigurationType.launchFlask;
    }
    public async buildConfiguration(input: MultiStepInput<DebugConfigurationState>, state: DebugConfigurationState) {
        const application = this.getApplicationPath(state.folder);
        let manuallyEnteredAValue: boolean | undefined;
        const config: Partial<LaunchRequestArguments> = {
            name: DebugConfigStrings.flask.snippet.name,
            type: DebuggerTypeName,
            request: 'launch',
            module: 'flask',
            env: {
                FLASK_APP: application || 'app.py',
                FLASK_DEBUG: '1',
            },
            args: ['run', '--no-debugger', '--no-reload'],
            jinja: true,
            justMyCode: true,
        };

        if (!application) {
            const selectedApp = await input.showInputBox({
                title: DebugConfigStrings.flask.enterAppPathOrNamePath.title,
                value: 'app.py',
                prompt: DebugConfigStrings.flask.enterAppPathOrNamePath.prompt,
                validate: (value) =>
                    Promise.resolve(
                        value && value.trim().length > 0
                            ? undefined
                            : DebugConfigStrings.flask.enterAppPathOrNamePath.invalid,
                    ),
            });
            if (selectedApp) {
                manuallyEnteredAValue = true;
                config.env!.FLASK_APP = selectedApp;
            }
        }

        sendTelemetryEvent(EventName.DEBUGGER_CONFIGURATION_PROMPTS, undefined, {
            configurationType: DebugConfigurationType.launchFlask,
            autoDetectedFlaskAppPyPath: !!application,
            manuallyEnteredAValue,
        });
        Object.assign(state.config, config);
    }
    protected getApplicationPath(folder: WorkspaceFolder | undefined): string | undefined {
        if (!folder) {
            return;
        }
        const defaultLocationOfManagePy = path.join(folder.uri.fsPath, 'app.py');
        if (fs.existsSync(defaultLocationOfManagePy)) {
            return 'app.py';
        }
    }
}
