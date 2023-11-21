// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IServiceManager } from '../../ioc/types';
import { LaunchRequestArguments } from '../types';
import { DebugEnvironmentVariablesHelper, IDebugEnvironmentVariablesService } from './configuration/resolvers/helper';
import { IDebugConfigurationResolver } from './configuration/resolvers/types';
import { LaunchConfigurationResolver } from './configuration/resolvers/launch';

export function registerTypes(serviceManager: IServiceManager): void {
    serviceManager.addSingleton<IDebugConfigurationResolver<LaunchRequestArguments>>(
        IDebugConfigurationResolver,
        LaunchConfigurationResolver,
        'launch',
    );
    serviceManager.addSingleton<IDebugEnvironmentVariablesService>(
        IDebugEnvironmentVariablesService,
        DebugEnvironmentVariablesHelper,
    );
}