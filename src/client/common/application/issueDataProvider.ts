import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

import { IssueDataProvider, ProviderResult, Uri, env } from 'vscode';
import { inject, injectable } from 'inversify';
import { isEqual } from 'lodash';
import { IConfigurationService, IDisposableRegistry, IPythonSettings } from '../types';
import { EXTENSION_ROOT_DIR } from '../constants';
import { IApplicationEnvironment, IWorkspaceService } from './types';
import { IInterpreterService } from '../../interpreter/contracts';
import { EnvironmentType } from '../../pythonEnvironments/info';
import { PythonSettings } from '../configSettings';
import { SystemVariables } from '../variables/systemVariables';
import { IExtensionSingleActivationService } from '../../activation/types';

@injectable()
export class PythonIssueDataProvider implements IssueDataProvider, IExtensionSingleActivationService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly packageJSONSettings: any;

    public readonly supportedWorkspaceTypes = { untrustedWorkspace: true, virtualWorkspace: true };

    constructor(
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
        @inject(IInterpreterService) private readonly interpreterService: IInterpreterService,
        @inject(IConfigurationService) protected readonly configurationService: IConfigurationService,
        @inject(IApplicationEnvironment) appEnvironment: IApplicationEnvironment,
        @inject(IDisposableRegistry) private readonly disposableRegistry: IDisposableRegistry,
    ) {
        this.packageJSONSettings = appEnvironment.packageJson?.contributes?.configuration?.properties;
    }

    private argSettingsPath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_user_settings.json');

    private templatePath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_template.md');

    private userDataTemplatePath = path.join(EXTENSION_ROOT_DIR, 'resources', 'report_issue_user_data_template.md');

    public async activate(): Promise<void> {
        this.disposableRegistry.push(
            env.registerIssueUriRequestHandler({
                handleIssueUrlRequest: () => Uri.parse('https://aka.ms/microsoft/vscode-python'),
            }),
        );
        this.disposableRegistry.push(env.registerIssueDataProvider(this));
    }

    public provideIssueTemplate(): ProviderResult<string> {
        return fs.readFile(this.templatePath, 'utf8').then((data) => data);
    }

    public async getIssueDataInfo(): Promise<string> {
        const settings: IPythonSettings = this.configurationService.getSettings();
        const argSettings = JSON.parse(await fs.readFile(this.argSettingsPath, 'utf8'));
        let userSettings = '';
        const keys: [keyof IPythonSettings] = Object.keys(settings) as [keyof IPythonSettings];
        keys.forEach((property) => {
            const argSetting = argSettings[property];
            if (argSetting) {
                if (typeof argSetting === 'object') {
                    let propertyHeaderAdded = false;
                    const argSettingsDict = (settings[property] as unknown) as Record<string, unknown>;
                    if (typeof argSettingsDict === 'object') {
                        Object.keys(argSetting).forEach((item) => {
                            const prop = argSetting[item];
                            if (prop) {
                                const defaultValue = this.getDefaultValue(`${property}.${item}`);
                                if (defaultValue === undefined || !isEqual(defaultValue, argSettingsDict[item])) {
                                    if (!propertyHeaderAdded) {
                                        userSettings = userSettings.concat(os.EOL, property, os.EOL);
                                        propertyHeaderAdded = true;
                                    }
                                    const value =
                                        prop === true ? JSON.stringify(argSettingsDict[item]) : '"<placeholder>"';
                                    userSettings = userSettings.concat('• ', item, ': ', value, os.EOL);
                                }
                            }
                        });
                    }
                } else {
                    const defaultValue = this.getDefaultValue(property);
                    if (defaultValue === undefined || !isEqual(defaultValue, settings[property])) {
                        const value = argSetting === true ? JSON.stringify(settings[property]) : '"<placeholder>"';
                        userSettings = userSettings.concat(os.EOL, property, ': ', value, os.EOL);
                    }
                }
            }
        });

        const template = await fs.readFile(this.userDataTemplatePath, 'utf8');
        const interpreter = await this.interpreterService.getActiveInterpreter();
        const pythonVersion = interpreter?.version?.raw ?? '';
        const languageServer =
            this.workspaceService.getConfiguration('python').get<string>('languageServer') || 'Not Found';
        const virtualEnvKind = interpreter?.envType || EnvironmentType.Unknown;

        const hasMultipleFolders = (this.workspaceService.workspaceFolders?.length ?? 0) > 1;
        const hasMultipleFoldersText =
            hasMultipleFolders && userSettings !== ''
                ? `Multiroot scenario, following user settings may not apply:${os.EOL}`
                : '';

        return template.format(pythonVersion, virtualEnvKind, languageServer, hasMultipleFoldersText, userSettings);
    }

    public provideIssueData(): ProviderResult<string> {
        return this.getIssueDataInfo().then((data) => data);
    }

    private getDefaultValue(settingKey: string) {
        if (!this.packageJSONSettings) {
            return undefined;
        }
        const resource = PythonSettings.getSettingsUriAndTarget(undefined, this.workspaceService).uri;
        const systemVariables = new SystemVariables(resource, undefined, this.workspaceService);
        return systemVariables.resolveAny(this.packageJSONSettings[`python.${settingKey}`]?.default);
    }
}
