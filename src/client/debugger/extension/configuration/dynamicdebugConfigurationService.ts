// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as path from 'path';
import { inject, injectable } from 'inversify';
import { CancellationToken, DebugConfiguration, WorkspaceFolder } from 'vscode';
import { IDynamicDebugConfigurationService } from '../types';
import { IFileSystem } from '../../../common/platform/types';
import { IPathUtils } from '../../../common/types';
import { DebuggerTypeName } from '../../constants';

const workspaceFolderToken = '${workspaceFolder}';

@injectable()
export class DynamicPythonDebugConfigurationService implements IDynamicDebugConfigurationService {
    constructor(@inject(IFileSystem) private fs: IFileSystem, @inject(IPathUtils) private pathUtils: IPathUtils) {}

    public async provideDebugConfigurations(
        folder: WorkspaceFolder,
        _token?: CancellationToken,
    ): Promise<DebugConfiguration[] | undefined> {
        const providers = [];

        providers.push({
            name: 'Dynamic Python: File',
            type: DebuggerTypeName,
            request: 'launch',
            program: '${file}',
            justMyCode: true,
        });

        const djangoManagePath = await this.fs.search(path.join(folder.uri.fsPath, '**/manage.py'));
        if (djangoManagePath.length) {
            const managePath = path.relative(folder.uri.fsPath, djangoManagePath[0]);
            providers.push({
                name: 'Dynamic Python: Django',
                type: DebuggerTypeName,
                request: 'launch',
                program: `${workspaceFolderToken}${this.pathUtils.separator}${managePath}`,
                args: ['runserver'],
                django: true,
                justMyCode: true,
            });
        }

        let fastApiPath = await this.getFastApiPath(folder);

        if (fastApiPath) {
            fastApiPath = path
                .relative(folder.uri.fsPath, fastApiPath)
                .replaceAll(this.pathUtils.separator, '.')
                .replace('.py', '');

            providers.push({
                name: 'Dynamic Python: FastAPI',
                type: DebuggerTypeName,
                request: 'launch',
                module: 'uvicorn',
                args: [`${fastApiPath}:app`],
                jinja: true,
                justMyCode: true,
            });
        }

        return providers;
    }

    private async getFastApiPath(folder: WorkspaceFolder) {
        const mainPaths = await this.fs.search(path.join(folder.uri.fsPath, '**/main.py'));
        const appPaths = await this.fs.search(path.join(folder.uri.fsPath, '**/app.py'));
        const possiblePaths = [...mainPaths, ...appPaths];
        const regExpression = /app\s*=\s*FastAPI\(/;
        const flaskPaths = possiblePaths.filter((applicationPath) =>
            regExpression.exec(this.fs.readFileSync(applicationPath).toString()),
        );

        return flaskPaths.length ? flaskPaths[0] : null;
    }
}
