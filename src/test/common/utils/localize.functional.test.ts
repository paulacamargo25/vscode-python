// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { EXTENSION_ROOT_DIR } from '../../../client/common/constants';
import * as localize from '../../../client/common/utils/localize';

// Defines a Mocha test suite to group tests of similar kind together
suite('Localization', () => {
    // Note: We use package.nls.json by default for tests.  Use the
    // setLocale() helper to switch to a different locale.

    let localeFiles: string[];
    let nls_orig: string | undefined;

    setup(() => {
        localeFiles = [];

        nls_orig = process.env.VSCODE_NLS_CONFIG;
        setLocale('en-us');
    });

    teardown(() => {
        if (nls_orig) {
            process.env.VSCODE_NLS_CONFIG = nls_orig;
        } else {
            delete process.env.VSCODE_NLS_CONFIG;
        }

        const filenames = localeFiles;
        localeFiles = [];
        for (const filename of filenames) {
            fs.unlinkSync(filename);
        }
    });

    function addLocale(locale: string, nls: Record<string, string>) {
        const filename = addLocaleFile(locale, nls);
        localeFiles.push(filename);
    }

    test('keys', (done) => {
        const val = localize.ExtensionSurveyBanner.bannerMessage;
        assert.strictEqual(
            val,
            'Can you please take 2 minutes to tell us how the Python extension is working for you?',
            'LanguageService string doesnt match',
        );
        done();
    });

    test('keys italian', (done) => {
        // Force a config change
        setLocale('it');

        const val = localize.ExtensionSurveyBanner.bannerLabelYes;
        assert.strictEqual(val, 'Sì, prenderò il sondaggio ora', 'bannerLabelYes is not being translated');
        done();
    });

    test('key found for locale', (done) => {
        addLocale('spam', {
            'debug.selectConfigurationTitle': '???',
            'Common.gotIt': '!!!',
        });
        setLocale('spam');

        const title = localize.DebugConfigStrings.selectConfiguration.title;
        const gotIt = localize.Common.gotIt;

        assert.strictEqual(title, '???', 'not used');
        assert.strictEqual(gotIt, '!!!', 'not used');
        done();
    });

    test('key not found for locale (default used)', (done) => {
        addLocale('spam', {
            'debug.selectConfigurationTitle': '???',
        });
        setLocale('spam');

        const gotIt = localize.Common.gotIt;

        assert.strictEqual(gotIt, 'Got it!', `default not used (got ${gotIt})`);
        done();
    });
});

function addLocaleFile(locale: string, nls: Record<string, string>) {
    const filename = path.join(EXTENSION_ROOT_DIR, `package.nls.${locale}.json`);
    if (fs.existsSync(filename)) {
        throw Error(`NLS file ${filename} already exists`);
    }
    const contents = JSON.stringify(nls);
    fs.writeFileSync(filename, contents);
    return filename;
}

function setLocale(locale: string) {
    let nls: Record<string, string>;
    if (process.env.VSCODE_NLS_CONFIG) {
        nls = JSON.parse(process.env.VSCODE_NLS_CONFIG);
        nls.locale = locale;
    } else {
        nls = { locale: locale };
    }
    process.env.VSCODE_NLS_CONFIG = JSON.stringify(nls);
}
