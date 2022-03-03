// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// IMPORTANT: Do not import any node fs related modules here, as they do not work in browser.

// Skip using vscode-nls and instead just compute our strings based on key values. Key values
// can be loaded out of the nls.<locale>.json files
let askedForCollection: Record<string, string> = {};

// This is exported only for testing purposes.
export function _resetCollections(): void {
    askedForCollection = {};
}

// This is exported only for testing purposes.
export function _getAskedForCollection(): Record<string, string> {
    return askedForCollection;
}
