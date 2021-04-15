// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';

import { inject, injectable } from 'inversify';
import { IExtensionSingleActivationService } from '../../../activation/types';
import { ICommandManager, IWorkspaceService } from '../types';
import { EXTENSION_ROOT_DIR } from '../../../constants';
import { IInterpreterVersionService } from '../../../interpreter/contracts';
import { PYTHON_PATH } from '../../../../test/common';
import { getVirtualEnvKind } from '../../../pythonEnvironments/discovery/locators/services/customVirtualEnvLocator';
import { IInterpreterPathService } from '../../types';
import { RESOURCE } from '../../../../test/testing/helper';

/**
 * Allows the user to report an issue related to the Python extension using our template.
 */
@injectable()
export class ReportIssueCommandHandler implements IExtensionSingleActivationService {
    constructor(
        @inject(ICommandManager) private readonly commandManager: ICommandManager,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
        @inject(IInterpreterPathService) private readonly interpreterPathService: IInterpreterPathService,
        @inject(IInterpreterVersionService) private readonly interpreterVersionService: IInterpreterVersionService,
    ) {}

    public async activate(): Promise<void> {
        this.commandManager.registerCommand('python.reportIssue', this.openReportIssue, this);
    }

    private templatePath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_template.md');

    public async openReportIssue(): Promise<void> {
        const pythonVersion = await this.interpreterVersionService.getVersion(PYTHON_PATH, '');
        const languageServer = this.workspaceService.getConfiguration('python').get<string>('languageServer');
        const path2 = this.interpreterPathService.get(RESOURCE);
        const virtualEnv = await getVirtualEnvKind(path2);
        const templ = this.getIssueTemplate();

        vscode.commands.executeCommand('workbench.action.openIssueReporter', {
            extensionId: 'ms-python.python',
            issueBody: templ.format(pythonVersion, virtualEnv, languageServer || ''),
        });
    }

    public getIssueTemplate(): string {
        const templ = fs.readFileSync(this.templatePath, 'utf8');
        return templ;
    }
}
