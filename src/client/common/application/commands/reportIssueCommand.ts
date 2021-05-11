// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import { inject, injectable } from 'inversify';
import { IExtensionSingleActivationService } from '../../../activation/types';
import { ICommandManager, IDocumentManager, IWorkspaceService } from '../types';
import { EXTENSION_ROOT_DIR } from '../../../constants';
import { IInterpreterService, IInterpreterVersionService } from '../../../interpreter/contracts';
import { identifyEnvironment } from '../../../pythonEnvironments/common/environmentIdentifier';

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
        @inject(IDocumentManager) private readonly documentManager: IDocumentManager,
    ) {}

    public async activate(): Promise<void> {
        this.commandManager.registerCommand('python.reportIssue', this.openReportIssue, this);
    }

    private templatePath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_template.md');

    private async fillTemplateData(): Promise<void> {
        return new Promise(() => {
            setTimeout(async () => {
                const template = await fs.readFile(this.templatePath, 'utf8');
                const interpreterPath = (await this.interpreterService.getActiveInterpreter())?.path || 'not-selected';
                const pythonVersion = await this.interpreterVersionService.getVersion(interpreterPath, '');
                const languageServer =
                    this.workspaceService.getConfiguration('python').get<string>('languageServer') || 'Not Found';
                const virtualEnv = await identifyEnvironment(interpreterPath);

                // Assumes caller has shown the Python Output window so that textDocuments is populated with our Log file
                let pythonLogs = '';
                const doc = this.documentManager.textDocuments.find((td) => td.languageId === 'Log');
                if (doc) {
                    pythonLogs = doc.getText();
                }

                this.commandManager.executeCommand('workbench.action.openIssueReporter', {
                    extensionId: 'ms-python.python',
                    issueBody: template.format(pythonVersion, virtualEnv, languageServer, pythonLogs),
                });
            }, 1000);
        });
    }

    public async openReportIssue(): Promise<void> {
        await this.commandManager.executeCommand('python.viewOutput');
        return this.fillTemplateData();
    }
}
