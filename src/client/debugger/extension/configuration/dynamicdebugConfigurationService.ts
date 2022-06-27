// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as path from 'path';
import { inject, injectable } from 'inversify';
import { CancellationToken, DebugConfiguration, WorkspaceFolder } from 'vscode';
import { IDebugConfigurationService } from '../types';
import { IFileSystem } from '../../../common/platform/types';
import { IPathUtils } from '../../../common/types';

const workspaceFolderToken = '${workspaceFolder}';

@injectable()
export class DynamicPythonDebugConfigurationService implements IDebugConfigurationService {
    constructor(@inject(IFileSystem) private fs: IFileSystem, @inject(IPathUtils) private pathUtils: IPathUtils) {}

    public async provideDebugConfigurations(
        folder: WorkspaceFolder,
        _token?: CancellationToken,
    ): Promise<DebugConfiguration[] | undefined> {
        const providers = [];
        const defaultLocationOfManagePy = path.join(folder.uri.path, 'manage.py');

        if (this.fs.fileExistsSync(defaultLocationOfManagePy)) {
            providers.push({
                name: 'Dynamic Python: Django',
                type: 'python',
                request: 'launch',
                program: `${workspaceFolderToken}${this.pathUtils.separator}manage.py`,
                args: ['runserver'],
                django: true,
                justMyCode: true,
            });
        }
        return providers;
    }
}
