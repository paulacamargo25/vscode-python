/* eslint-disable global-require */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import { anything, instance, mock, when } from 'ts-mockito';
import { expect } from 'chai';
import { WorkspaceFolder } from 'vscode-languageserver-protocol';
import { CommandManager } from '../../../client/common/application/commandManager';
import { PythonIssueDataProvider } from '../../../client/common/application/issueDataProvider';
import {
    IApplicationEnvironment,
    ICommandManager,
    IWorkspaceService,
} from '../../../client/common/application/types';
import { WorkspaceService } from '../../../client/common/application/workspace';
import { IInterpreterService } from '../../../client/interpreter/contracts';
import { MockWorkspaceConfiguration } from '../../mocks/mockWorkspaceConfig';
import { InterpreterService } from '../../../client/interpreter/interpreterService';
import { EXTENSION_ROOT_DIR } from '../../../client/common/constants';
import { ConfigurationService } from '../../../client/common/configuration/service';
import { IConfigurationService } from '../../../client/common/types';
import { EnvironmentType, PythonEnvironment } from '../../../client/pythonEnvironments/info';
import { EXTENSION_ROOT_DIR_FOR_TESTS } from '../../constants';
import { LanguageServerType } from '../../../client/activation/types';

suite('Report Issue Command', () => {
    let pythonIssueDataProvider: PythonIssueDataProvider;
    let cmdManager: ICommandManager;
    let workspaceService: IWorkspaceService;
    let interpreterService: IInterpreterService;
    let configurationService: IConfigurationService;
    let appEnvironment: IApplicationEnvironment;

    setup(async () => {
        workspaceService = mock(WorkspaceService);
        cmdManager = mock(CommandManager);
        interpreterService = mock(InterpreterService);
        configurationService = mock(ConfigurationService);
        appEnvironment = mock<IApplicationEnvironment>();

        when(cmdManager.executeCommand('workbench.action.openIssueReporter', anything())).thenResolve();
        when(workspaceService.getConfiguration('python')).thenReturn(
            new MockWorkspaceConfiguration({
                languageServer: LanguageServerType.Node,
            }),
        );
        const interpreter = ({
            envType: EnvironmentType.Venv,
            version: { raw: '3.9.0' },
        } as unknown) as PythonEnvironment;
        when(interpreterService.getActiveInterpreter()).thenResolve(interpreter);
        when(configurationService.getSettings()).thenReturn({
            experiments: {
                enabled: false,
                optInto: [],
                optOutFrom: [],
            },
            initialize: true,
            venvPath: 'path',
            pipenvPath: 'pipenv',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        pythonIssueDataProvider = new PythonIssueDataProvider(
            instance(workspaceService),
            instance(interpreterService),
            instance(configurationService),
            instance(appEnvironment),
            []
        );
    });

    teardown(() => {
        sinon.restore();
    });

    test('Test if issue data info is filled correctly when including all the settings', async () => {
        const templatePath = path.join(
            EXTENSION_ROOT_DIR_FOR_TESTS,
            'src',
            'test',
            'common',
            'application',
            'issueTemplateVenv1.md',
        );
        const expectedIssueBody = fs.readFileSync(templatePath, 'utf8');
        let info = await pythonIssueDataProvider.getIssueDataInfo()

        expect(info).to.be.equal(expectedIssueBody);
    });

    test('Test if issue data info is filled when only including settings which are explicitly set', async () => {
        // eslint-disable-next-line import/no-dynamic-require
        when(appEnvironment.packageJson).thenReturn(require(path.join(EXTENSION_ROOT_DIR, 'package.json')));
        when(workspaceService.workspaceFolders).thenReturn([
            instance(mock(WorkspaceFolder)),
            instance(mock(WorkspaceFolder)),
        ]); // Multiroot scenario

        pythonIssueDataProvider = new PythonIssueDataProvider(
            instance(workspaceService),
            instance(interpreterService),
            instance(configurationService),
            instance(appEnvironment),
            []
        );
        const templatePath = path.join(
            EXTENSION_ROOT_DIR_FOR_TESTS,
            'src',
            'test',
            'common',
            'application',
            'issueTemplateVenv2.md',
        );
        const expectedIssueBody = fs.readFileSync(templatePath, 'utf8');
        let info = await pythonIssueDataProvider.getIssueDataInfo()

        expect(info).to.be.equal(expectedIssueBody);
    });
});
