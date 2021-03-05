// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as vscode from 'vscode';
import { inject, injectable } from 'inversify';
import { IExtensionSingleActivationService } from '../../../activation/types';
import { ICommandManager } from '../types';

/**
 * Prompts user to reload VS Code with a custom message, and reloads if necessary.
 */
@injectable()
export class ReportIssueCommandHandler implements IExtensionSingleActivationService {
    constructor(@inject(ICommandManager) private readonly commandManager: ICommandManager) {}

    public async activate(): Promise<void> {
        this.commandManager.registerCommand('python.reportIssue', this.openReportIssue, this);
    }

    public openReportIssue(): void {
        vscode.commands.executeCommand('workbench.action.openIssueReporter', {
            extensionId: 'vscode.vscode-python',
            issueBody: this.issueTemplate,
        });
    }

    private issueTemplate = `## Environment data
    - VS Code version:
    - Extension version (available under the Extensions sidebar):
    - OS and version:
    - Python version (& distribution if applicable, e.g. Anaconda):
    - Type of virtual environment used (N/A | venv | virtualenv | conda | ...):
    - Relevant/affected Python packages and their versions:
    - Relevant/affected Python-related VS Code extensions and their versions:
    - Value of the python.languageServer setting:

[**NOTE**: If you suspect that your issue is related to the Microsoft Python Language Server (python.languageServer: 'Microsoft'), please download our new language server [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) from the VS Code marketplace to see if that fixes your issue]

## Expected behaviour:

## Actual behaviour:

## Steps to reproduce:

[**NOTE**: Self-contained, minimal reproducing code samples are **extremely** helpful and will expedite addressing your issue]

1. XXX

<!--
Note: If you think a GIF of what is happening would be helpful, consider tools like https://www.cockos.com/licecap/, https://github.com/phw/peek or https://www.screentogif.com/ .
-->

## Logs

<details>

<summary>Output for <code>Python</code> in the <code>Output</code> panel (<code>View</code>→<code>Output</code>, change the drop-down the upper-right of the <code>Output</code> panel to <code>Python</code>)
</summary>

<p>
${'``` ```'}
</p>
</details>`;
}
