// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { Readable } from 'stream';
import { DebugAdapterTrackerFactory, DebugConfigurationProvider, Disposable } from 'vscode';

export const IDebugConfigurationService = Symbol('IDebugConfigurationService');
export interface IDebugConfigurationService extends DebugConfigurationProvider {}

export const IDynamicDebugConfigurationService = Symbol('IDynamicDebugConfigurationService');
export interface IDynamicDebugConfigurationService extends DebugConfigurationProvider {}

export enum DebugConfigurationType {
    launchFile = 'launchFile',
    remoteAttach = 'remoteAttach',
    launchDjango = 'launchDjango',
    launchFastAPI = 'launchFastAPI',
    launchFlask = 'launchFlask',
    launchModule = 'launchModule',
    launchPyramid = 'launchPyramid',
    pidAttach = 'pidAttach',
}

export enum PythonPathSource {
    launchJson = 'launch.json',
    settingsJson = 'settings.json',
}

export const IOutdatedDebuggerPromptFactory = Symbol('IOutdatedDebuggerPromptFactory');

export interface IOutdatedDebuggerPromptFactory extends DebugAdapterTrackerFactory {}

export const IProtocolParser = Symbol('IProtocolParser');
export interface IProtocolParser extends Disposable {
    connect(stream: Readable): void;
    once(event: string | symbol, listener: (...args: unknown[]) => void): this;
    on(event: string | symbol, listener: (...args: unknown[]) => void): this;
}
