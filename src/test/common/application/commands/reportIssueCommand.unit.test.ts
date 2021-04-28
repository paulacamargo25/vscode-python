// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { expect } from 'chai';
import { LanguageServerType } from '../../../../client/activation/types';
import { CommandManager } from '../../../../client/common/application/commandManager';
import { ReportIssueCommandHandler } from '../../../../client/common/application/commands/reportIssueCommand';
import { ICommandManager, IWorkspaceService } from '../../../../client/common/application/types';
import { WorkspaceService } from '../../../../client/common/application/workspace';
import { InterpreterPathService } from '../../../../client/common/interpreterPathService';
import { IInterpreterPathService } from '../../../../client/common/types';
import { IInterpreterVersionService } from '../../../../client/interpreter/contracts';
import { InterpreterVersionService } from '../../../../client/interpreter/interpreterVersion';
import { PythonEnvKind } from '../../../../client/pythonEnvironments/base/info';
import * as EnvIdentifier from '../../../../client/pythonEnvironments/common/environmentIdentifier';
import { MockWorkspaceConfiguration } from '../../../startPage/mockWorkspaceConfig';
import { EXTENSION_ROOT_DIR_FOR_TESTS } from '../../../constants';

suite('Report Issue Command', () => {
    let reportIssueCommandHandler: ReportIssueCommandHandler;
    let cmdManager: ICommandManager;
    let workspaceService: IWorkspaceService;
    let interpreterVersionService: IInterpreterVersionService;
    let interpreterPathService: IInterpreterPathService;
    let identifyEnvironmentStub: sinon.SinonStub;

    setup(async () => {
        interpreterVersionService = mock(InterpreterVersionService);
        workspaceService = mock(WorkspaceService);
        cmdManager = mock(CommandManager);
        interpreterPathService = mock(InterpreterPathService);

        when(interpreterVersionService.getVersion(anything(), anything())).thenResolve('3.9.0');
        when(workspaceService.getConfiguration('python')).thenReturn(
            new MockWorkspaceConfiguration({
                languageServer: { globalValue: LanguageServerType.Node },
            }),
        );
        when(interpreterPathService.get(anything())).thenReturn('python');
        identifyEnvironmentStub = sinon.stub(EnvIdentifier, 'identifyEnvironment');
        identifyEnvironmentStub.resolves(PythonEnvKind.Venv);

        cmdManager = mock(CommandManager);
        reportIssueCommandHandler = new ReportIssueCommandHandler(
            instance(cmdManager),
            instance(workspaceService),
            instance(interpreterPathService),
            instance(interpreterVersionService),
        );

        when(cmdManager.executeCommand(anything())).thenResolve();
        await reportIssueCommandHandler.activate();
    });

    teardown(() => {
        identifyEnvironmentStub.restore();
    });

    test('Confirm command handler is added', async () => {
        await reportIssueCommandHandler.openReportIssue();
        const templatePath = path.join(
            EXTENSION_ROOT_DIR_FOR_TESTS,
            'src',
            'test',
            'common',
            'application',
            'commands',
            'issueTemplateVenv1.md',
        );
        const templ = fs.readFileSync(templatePath, 'utf8');
        const args = capture(cmdManager.executeCommand).last();
        verify(cmdManager.registerCommand('python.reportIssue', anything(), anything())).once();
        verify(cmdManager.executeCommand('workbench.action.openIssueReporter', anything())).once();
        expect(args[1].issueBody).to.be.equal(templ);
    });
});
