// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as TypeMoq from 'typemoq';
import { TextDocument } from 'vscode';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { expect } from 'chai';
import { LanguageServerType } from '../../../../client/activation/types';
import { CommandManager } from '../../../../client/common/application/commandManager';
import { ReportIssueCommandHandler } from '../../../../client/common/application/commands/reportIssueCommand';
import { ICommandManager, IDocumentManager, IWorkspaceService } from '../../../../client/common/application/types';
import { WorkspaceService } from '../../../../client/common/application/workspace';
import { IInterpreterService, IInterpreterVersionService } from '../../../../client/interpreter/contracts';
import { InterpreterVersionService } from '../../../../client/interpreter/interpreterVersion';
import { PythonEnvKind } from '../../../../client/pythonEnvironments/base/info';
import * as EnvIdentifier from '../../../../client/pythonEnvironments/common/environmentIdentifier';
import { MockWorkspaceConfiguration } from '../../../startPage/mockWorkspaceConfig';
import { EXTENSION_ROOT_DIR_FOR_TESTS } from '../../../constants';
import { InterpreterService } from '../../../../client/interpreter/interpreterService';
import { DocumentManager } from '../../../../client/common/application/documentManager';

suite('Report Issue Command', () => {
    let reportIssueCommandHandler: ReportIssueCommandHandler;
    let cmdManager: ICommandManager;
    let workspaceService: IWorkspaceService;
    let interpreterVersionService: IInterpreterVersionService;
    let documentManager: IDocumentManager;
    let interpreterService: IInterpreterService;
    let identifyEnvironmentStub: sinon.SinonStub;

    setup(async () => {
        interpreterVersionService = mock(InterpreterVersionService);
        workspaceService = mock(WorkspaceService);
        cmdManager = mock(CommandManager);
        interpreterService = mock(InterpreterService);
        documentManager = mock(DocumentManager);

        when(interpreterVersionService.getVersion(anything(), anything())).thenResolve('3.9.0');
        when(workspaceService.getConfiguration('python')).thenReturn(
            new MockWorkspaceConfiguration({
                languageServer: LanguageServerType.Node,
            }),
        );
        when(interpreterService.getActiveInterpreter(anything())).thenResolve(undefined);
        identifyEnvironmentStub = sinon.stub(EnvIdentifier, 'identifyEnvironment');
        identifyEnvironmentStub.resolves(PythonEnvKind.Venv);

        cmdManager = mock(CommandManager);
        reportIssueCommandHandler = new ReportIssueCommandHandler(
            instance(cmdManager),
            instance(workspaceService),
            instance(interpreterService),
            instance(interpreterVersionService),
            instance(documentManager),
        );

        const document = TypeMoq.Mock.ofType<TextDocument>();
        document.setup((doc) => doc.getText(TypeMoq.It.isAny())).returns(() => 'Python Output');
        document.setup((d) => d.languageId).returns(() => 'Log');
        when(documentManager.textDocuments).thenReturn([document.object]);

        when(cmdManager.executeCommand('python.viewOutput')).thenReturn(Promise.resolve());
        when(cmdManager.executeCommand('workbench.action.openIssueReporter', anything())).thenResolve();
        await reportIssueCommandHandler.activate();
    });

    teardown(() => {
        identifyEnvironmentStub.restore();
    });

    test('Test if issue body is filled', async () => {
        reportIssueCommandHandler.openReportIssue().then(() => {
            const templatePath = path.join(
                EXTENSION_ROOT_DIR_FOR_TESTS,
                'src',
                'test',
                'common',
                'application',
                'commands',
                'issueTemplateVenv1.md',
            );
            const expectedIssueBody = fs.readFileSync(templatePath, 'utf8');

            const args: [string, { extensionId: string; issueBody: string }] = capture<
                string,
                { extensionId: string; issueBody: string }
            >(cmdManager.executeCommand).last();

            verify(cmdManager.registerCommand('python.reportIssue', anything(), anything())).once();
            verify(cmdManager.executeCommand('workbench.action.openIssueReporter', anything())).once();
            expect(args[1].issueBody).to.be.equal(expectedIssueBody);
        });
    });
});
