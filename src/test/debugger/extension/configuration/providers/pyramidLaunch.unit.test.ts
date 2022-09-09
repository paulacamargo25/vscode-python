// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import { anything, instance, mock, when } from 'ts-mockito';
import { Uri, WorkspaceFolder } from 'vscode';
import * as workspaceFolder from '../../../../../client/common/utils/workspaceFolder';
import { DebugConfigStrings } from '../../../../../client/common/utils/localize';
import { MultiStepInput } from '../../../../../client/common/utils/multiStepInput';
import { DebuggerTypeName } from '../../../../../client/debugger/constants';
import { resolveVariables } from '../../../../../client/debugger/extension/configuration/providers/common';
import { PyramidLaunchDebugConfigurationProvider } from '../../../../../client/debugger/extension/configuration/providers/pyramidLaunch';
import { DebugConfigurationState } from '../../../../../client/debugger/extension/types';

suite('Debugging - Configuration Provider Pyramid', () => {
    let provider: TestPyramidLaunchDebugConfigurationProvider;
    let input: MultiStepInput<DebugConfigurationState>;
    let pathExistsStub: sinon.SinonStub;
    let pathSeparatorStub: sinon.SinonStub;
    let workspaceStub: sinon.SinonStub;
    class TestPyramidLaunchDebugConfigurationProvider extends PyramidLaunchDebugConfigurationProvider {
        public async getDevelopmentIniPath(folder: WorkspaceFolder): Promise<string | undefined> {
            return super.getDevelopmentIniPath(folder);
        }
    }
    setup(() => {
        input = mock<MultiStepInput<DebugConfigurationState>>(MultiStepInput);
        provider = new TestPyramidLaunchDebugConfigurationProvider();
        pathExistsStub = sinon.stub(fs, 'pathExists');
        pathSeparatorStub = sinon.stub(path, 'sep');
        workspaceStub = sinon.stub(workspaceFolder, 'getWorkspaceFolder');
    });
    teardown(() => {
        sinon.restore();
    });
    test("getDevelopmentIniPath should return undefined if file doesn't exist", async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const managePyPath = path.join(folder.uri.fsPath, 'development.ini');
        pathExistsStub.withArgs(managePyPath).resolves(false);
        const file = await provider.getDevelopmentIniPath(folder);

        expect(file).to.be.equal(undefined, 'Should return undefined');
    });
    test('getDevelopmentIniPath should file path', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const managePyPath = path.join(folder.uri.fsPath, 'development.ini');
        pathSeparatorStub.value('-');
        pathExistsStub.withArgs(managePyPath).resolves(true);
        const file = await provider.getDevelopmentIniPath(folder);

        expect(file).to.be.equal('${workspaceFolder}-development.ini');
    });
    test('Resolve variables (with resource)', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        workspaceStub.returns(folder);
        const resolvedPath = resolveVariables('${workspaceFolder}/one.py', undefined, folder);

        expect(resolvedPath).to.be.equal(`${folder.uri.fsPath}/one.py`);
    });
    test('Validation of path should return errors if path is undefined', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const error = await provider.validateIniPath(folder, '');

        expect(error).to.be.length.greaterThan(1);
    });
    test('Validation of path should return errors if path is empty', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const error = await provider.validateIniPath(folder, '', '');

        expect(error).to.be.length.greaterThan(1);
    });
    test('Validation of path should return errors if resolved path is empty', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const error = await provider.validateIniPath(folder, '', 'x');

        expect(error).to.be.length.greaterThan(1);
    });
    test("Validation of path should return errors if resolved path doesn't exist", async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        pathExistsStub.withArgs('xyz').resolves(false);
        const error = await provider.validateIniPath(folder, '', 'x');

        expect(error).to.be.length.greaterThan(1);
    });
    test('Validation of path should return errors if resolved path is non-ini', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        pathExistsStub.withArgs('xyz.txt').resolves(true);
        const error = await provider.validateIniPath(folder, '', 'x');

        expect(error).to.be.length.greaterThan(1);
    });
    test('Validation of path should not return errors if resolved path is ini', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        pathExistsStub.withArgs('xyz.ini').resolves(true);
        const error = await provider.validateIniPath(folder, '', 'xyz.ini');

        expect(error).to.be.equal(undefined, 'should not have errors');
    });
    test('Launch JSON with valid ini path', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const state = { config: {}, folder };
        provider.getDevelopmentIniPath = () => Promise.resolve('xyz.ini');
        pathSeparatorStub.value('-');

        await provider.buildConfiguration(instance(input), state);

        const config = {
            name: DebugConfigStrings.pyramid.snippet.name,
            type: DebuggerTypeName,
            request: 'launch',
            module: 'pyramid.scripts.pserve',
            args: ['xyz.ini'],
            pyramid: true,
            jinja: true,
            justMyCode: true,
        };

        expect(state.config).to.be.deep.equal(config);
    });
    test('Launch JSON with selected ini path', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const state = { config: {}, folder };
        provider.getDevelopmentIniPath = () => Promise.resolve(undefined);
        pathSeparatorStub.value('-');
        when(input.showInputBox(anything())).thenResolve('hello');

        await provider.buildConfiguration(instance(input), state);

        const config = {
            name: DebugConfigStrings.pyramid.snippet.name,
            type: DebuggerTypeName,
            request: 'launch',
            module: 'pyramid.scripts.pserve',
            args: ['hello'],
            pyramid: true,
            jinja: true,
            justMyCode: true,
        };

        expect(state.config).to.be.deep.equal(config);
    });
    test('Launch JSON with default ini path', async () => {
        const folder = { uri: Uri.parse(path.join('one', 'two')), name: '1', index: 0 };
        const state = { config: {}, folder };
        provider.getDevelopmentIniPath = () => Promise.resolve(undefined);
        const workspaceFolderToken = '${workspaceFolder}';
        const defaultIni = `${workspaceFolderToken}-development.ini`;

        pathSeparatorStub.value('-');
        when(input.showInputBox(anything())).thenResolve();

        await provider.buildConfiguration(instance(input), state);

        const config = {
            name: DebugConfigStrings.pyramid.snippet.name,
            type: DebuggerTypeName,
            request: 'launch',
            module: 'pyramid.scripts.pserve',
            args: [defaultIni],
            pyramid: true,
            jinja: true,
            justMyCode: true,
        };

        expect(state.config).to.be.deep.equal(config);
    });
});
