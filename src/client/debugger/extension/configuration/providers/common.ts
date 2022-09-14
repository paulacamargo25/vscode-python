/* eslint-disable @typescript-eslint/no-explicit-any */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { WorkspaceFolder } from 'vscode';
import { DebugConfigStrings } from '../../../../common/utils/localize';
import { MultiStepInput } from '../../../../common/utils/multiStepInput';
import { getWorkspaceFolder } from '../../../../common/utils/workspaceFolder';
import { sendTelemetryEvent } from '../../../../telemetry';
import { EventName } from '../../../../telemetry/constants';
import { AttachRequestArguments } from '../../../types';
import { DebugConfigurationState, DebugConfigurationType } from '../../types';

const defaultPort = 5678;

/**
 * @returns whether the provided parameter is a JavaScript String or not.
 */
function isString(str: any): str is string {
    if (typeof str === 'string' || str instanceof String) {
        return true;
    }

    return false;
}

export function resolveVariables(
    value: string,
    rootFolder: string | undefined,
    folder: WorkspaceFolder | undefined,
): string {
    const workspace = folder ? getWorkspaceFolder(folder.uri) : undefined;
    const variablesObject: { [key: string]: any } = {};
    variablesObject.workspaceFolder = workspace ? workspace.uri.fsPath : rootFolder;

    const regexp = /\$\{(.*?)\}/g;
    return value.replace(regexp, (match: string, name: string) => {
        const newValue = variablesObject[name];
        if (isString(newValue)) {
            return newValue;
        }
        return match && (match.indexOf('env.') > 0 || match.indexOf('env:') > 0) ? '' : match;
    });
}

export async function configurePort(
    input: MultiStepInput<DebugConfigurationState>,
    config: Partial<AttachRequestArguments>,
): Promise<void> {
    const connect = config.connect || (config.connect = {});
    const port = await input.showInputBox({
        title: DebugConfigStrings.attach.enterRemotePort.title,
        step: 2,
        totalSteps: 2,
        value: (connect.port || defaultPort).toString(),
        prompt: DebugConfigStrings.attach.enterRemotePort.prompt,
        validate: (value) =>
            Promise.resolve(
                value && /^\d+$/.test(value.trim()) ? undefined : DebugConfigStrings.attach.enterRemotePort.invalid,
            ),
    });
    if (port && /^\d+$/.test(port.trim())) {
        connect.port = parseInt(port, 10);
    }
    if (!connect.port) {
        connect.port = defaultPort;
    }
    sendTelemetryEvent(EventName.DEBUGGER_CONFIGURATION_PROMPTS, undefined, {
        configurationType: DebugConfigurationType.remoteAttach,
        manuallyEnteredAValue: connect.port !== defaultPort,
    });
}
