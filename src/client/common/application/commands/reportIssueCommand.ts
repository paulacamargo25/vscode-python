// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import { inject, injectable } from 'inversify';
import { IExtensionSingleActivationService } from '../../../activation/types';
import { IActiveResourceService, ICommandManager, IWorkspaceService } from '../types';
import { EXTENSION_ROOT_DIR } from '../../../constants';
import { IInterpreterVersionService } from '../../../interpreter/contracts';
import { IInterpreterPathService } from '../../types';
import { identifyEnvironment } from '../../../pythonEnvironments/common/environmentIdentifier';

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
        @inject(IActiveResourceService) private readonly activeResourceService: IActiveResourceService,
    ) {}

    public async activate(): Promise<void> {
        this.commandManager.registerCommand('python.reportIssue', this.openReportIssue, this);
    }

    private templatePath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_template.md');

    public async openReportIssue(): Promise<void> {
        const template = await fs.readFile(this.templatePath, 'utf8');
        const interpreterPath = this.interpreterPathService.get(this.activeResourceService.getActiveResource());
        const pythonVersion = await this.interpreterVersionService.getVersion(interpreterPath, '');
        const languageServer =
            this.workspaceService.getConfiguration('python').get<string>('languageServer') || 'Not Found';
        const virtualEnv = await identifyEnvironment(interpreterPath);

        this.commandManager.executeCommand('workbench.action.openIssueReporter', {
            extensionId: 'ms-python.python',
            issueBody: template.format(pythonVersion, virtualEnv, languageServer),
        });
    }
}
