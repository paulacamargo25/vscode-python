// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { instance, mock, verify } from 'ts-mockito';
import { LaunchConfigurationResolver } from '../../../client/debugger/extension/configuration/resolvers/launch';
import { registerTypes } from '../../../client/debugger/extension/serviceRegistry';
import { LaunchRequestArguments } from '../../../client/debugger/types';
import { ServiceManager } from '../../../client/ioc/serviceManager';
import { IServiceManager } from '../../../client/ioc/types';
import { IDebugConfigurationResolver } from '../../../client/debugger/extension/configuration/types';

suite('Debugging - Service Registry', () => {
    let serviceManager: IServiceManager;

    setup(() => {
        serviceManager = mock(ServiceManager);
    });
    test('Registrations', () => {
        registerTypes(instance(serviceManager));

        verify(
            serviceManager.addSingleton<IDebugConfigurationResolver<LaunchRequestArguments>>(
                IDebugConfigurationResolver,
                LaunchConfigurationResolver,
                'launch',
            ),
        ).once();
    });
});
