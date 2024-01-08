// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

export enum EventName {
    FORMAT_ON_TYPE = 'FORMAT.FORMAT_ON_TYPE',
    EDITOR_LOAD = 'EDITOR.LOAD',
    REPL = 'REPL',
    CREATE_NEW_FILE_COMMAND = 'CREATE_NEW_FILE_COMMAND',
    SELECT_INTERPRETER = 'SELECT_INTERPRETER',
    SELECT_INTERPRETER_ENTER_BUTTON = 'SELECT_INTERPRETER_ENTER_BUTTON',
    SELECT_INTERPRETER_ENTER_CHOICE = 'SELECT_INTERPRETER_ENTER_CHOICE',
    SELECT_INTERPRETER_SELECTED = 'SELECT_INTERPRETER_SELECTED',
    SELECT_INTERPRETER_ENTER_OR_FIND = 'SELECT_INTERPRETER_ENTER_OR_FIND',
    SELECT_INTERPRETER_ENTERED_EXISTS = 'SELECT_INTERPRETER_ENTERED_EXISTS',
    PYTHON_INTERPRETER = 'PYTHON_INTERPRETER',
    PYTHON_INSTALL_PACKAGE = 'PYTHON_INSTALL_PACKAGE',
    ENVIRONMENT_WITHOUT_PYTHON_SELECTED = 'ENVIRONMENT_WITHOUT_PYTHON_SELECTED',
    PYTHON_ENVIRONMENTS_API = 'PYTHON_ENVIRONMENTS_API',
    PYTHON_INTERPRETER_DISCOVERY = 'PYTHON_INTERPRETER_DISCOVERY',
    PYTHON_INTERPRETER_AUTO_SELECTION = 'PYTHON_INTERPRETER_AUTO_SELECTION',
    PYTHON_INTERPRETER_ACTIVATION_ENVIRONMENT_VARIABLES = 'PYTHON_INTERPRETER.ACTIVATION_ENVIRONMENT_VARIABLES',
    PYTHON_INTERPRETER_ACTIVATION_FOR_RUNNING_CODE = 'PYTHON_INTERPRETER_ACTIVATION_FOR_RUNNING_CODE',
    PYTHON_INTERPRETER_ACTIVATION_FOR_TERMINAL = 'PYTHON_INTERPRETER_ACTIVATION_FOR_TERMINAL',
    TERMINAL_SHELL_IDENTIFICATION = 'TERMINAL_SHELL_IDENTIFICATION',
    PYTHON_INTERPRETER_ACTIVATE_ENVIRONMENT_PROMPT = 'PYTHON_INTERPRETER_ACTIVATE_ENVIRONMENT_PROMPT',
    PYTHON_NOT_INSTALLED_PROMPT = 'PYTHON_NOT_INSTALLED_PROMPT',
    CONDA_INHERIT_ENV_PROMPT = 'CONDA_INHERIT_ENV_PROMPT',
    TERMINAL_DEACTIVATE_PROMPT = 'TERMINAL_DEACTIVATE_PROMPT',
    REQUIRE_JUPYTER_PROMPT = 'REQUIRE_JUPYTER_PROMPT',
    ACTIVATED_CONDA_ENV_LAUNCH = 'ACTIVATED_CONDA_ENV_LAUNCH',
    ENVFILE_VARIABLE_SUBSTITUTION = 'ENVFILE_VARIABLE_SUBSTITUTION',
    ENVFILE_WORKSPACE = 'ENVFILE_WORKSPACE',
    EXECUTION_CODE = 'EXECUTION_CODE',
    EXECUTION_DJANGO = 'EXECUTION_DJANGO',
    DEBUG_IN_TERMINAL_BUTTON = 'DEBUG.IN_TERMINAL',
    DEBUG_ADAPTER_USING_WHEELS_PATH = 'DEBUG_ADAPTER.USING_WHEELS_PATH',
    DEBUG_SESSION_ERROR = 'DEBUG_SESSION.ERROR',
    DEBUG_SESSION_START = 'DEBUG_SESSION.START',
    DEBUG_SESSION_STOP = 'DEBUG_SESSION.STOP',
    DEBUG_SESSION_USER_CODE_RUNNING = 'DEBUG_SESSION.USER_CODE_RUNNING',
    DEBUGGER = 'DEBUGGER',
    DEBUGGER_ATTACH_TO_CHILD_PROCESS = 'DEBUGGER.ATTACH_TO_CHILD_PROCESS',
    DEBUGGER_ATTACH_TO_LOCAL_PROCESS = 'DEBUGGER.ATTACH_TO_LOCAL_PROCESS',

    // Python testing specific telemetry
    UNITTEST_CONFIGURING = 'UNITTEST.CONFIGURING',
    UNITTEST_CONFIGURE = 'UNITTEST.CONFIGURE',
    UNITTEST_DISCOVERY_TRIGGER = 'UNITTEST.DISCOVERY.TRIGGER',
    UNITTEST_DISCOVERING = 'UNITTEST.DISCOVERING',
    UNITTEST_DISCOVERING_STOP = 'UNITTEST.DISCOVERY.STOP',
    UNITTEST_DISCOVERY_DONE = 'UNITTEST.DISCOVERY.DONE',
    UNITTEST_RUN_STOP = 'UNITTEST.RUN.STOP',
    UNITTEST_RUN = 'UNITTEST.RUN',
    UNITTEST_RUN_ALL_FAILED = 'UNITTEST.RUN_ALL_FAILED',
    UNITTEST_DISABLED = 'UNITTEST.DISABLED',

    PYTHON_EXPERIMENTS_INIT_PERFORMANCE = 'PYTHON_EXPERIMENTS_INIT_PERFORMANCE',
    PYTHON_EXPERIMENTS_LSP_NOTEBOOKS = 'PYTHON_EXPERIMENTS_LSP_NOTEBOOKS',
    PYTHON_EXPERIMENTS_OPT_IN_OPT_OUT_SETTINGS = 'PYTHON_EXPERIMENTS_OPT_IN_OPT_OUT_SETTINGS',

    EXTENSION_SURVEY_PROMPT = 'EXTENSION_SURVEY_PROMPT',

    LANGUAGE_SERVER_ENABLED = 'LANGUAGE_SERVER.ENABLED',
    LANGUAGE_SERVER_STARTUP = 'LANGUAGE_SERVER.STARTUP',
    LANGUAGE_SERVER_READY = 'LANGUAGE_SERVER.READY',
    LANGUAGE_SERVER_TELEMETRY = 'LANGUAGE_SERVER.EVENT',
    LANGUAGE_SERVER_REQUEST = 'LANGUAGE_SERVER.REQUEST',
    LANGUAGE_SERVER_RESTART = 'LANGUAGE_SERVER.RESTART',

    TERMINAL_CREATE = 'TERMINAL.CREATE',
    ACTIVATE_ENV_IN_CURRENT_TERMINAL = 'ACTIVATE_ENV_IN_CURRENT_TERMINAL',
    ACTIVATE_ENV_TO_GET_ENV_VARS_FAILED = 'ACTIVATE_ENV_TO_GET_ENV_VARS_FAILED',
    DIAGNOSTICS_ACTION = 'DIAGNOSTICS.ACTION',
    DIAGNOSTICS_MESSAGE = 'DIAGNOSTICS.MESSAGE',

    USE_REPORT_ISSUE_COMMAND = 'USE_REPORT_ISSUE_COMMAND',

    HASHED_PACKAGE_NAME = 'HASHED_PACKAGE_NAME',

    JEDI_LANGUAGE_SERVER_ENABLED = 'JEDI_LANGUAGE_SERVER.ENABLED',
    JEDI_LANGUAGE_SERVER_STARTUP = 'JEDI_LANGUAGE_SERVER.STARTUP',
    JEDI_LANGUAGE_SERVER_READY = 'JEDI_LANGUAGE_SERVER.READY',
    JEDI_LANGUAGE_SERVER_REQUEST = 'JEDI_LANGUAGE_SERVER.REQUEST',

    TENSORBOARD_SESSION_LAUNCH = 'TENSORBOARD.SESSION_LAUNCH',
    TENSORBOARD_SESSION_DURATION = 'TENSORBOARD.SESSION_DURATION',
    TENSORBOARD_SESSION_DAEMON_STARTUP_DURATION = 'TENSORBOARD.SESSION_DAEMON_STARTUP_DURATION',
    TENSORBOARD_LAUNCH_PROMPT_SELECTION = 'TENSORBOARD.LAUNCH_PROMPT_SELECTION',
    TENSORBOARD_SESSION_E2E_STARTUP_DURATION = 'TENSORBOARD.SESSION_E2E_STARTUP_DURATION',
    TENSORBOARD_ENTRYPOINT_SHOWN = 'TENSORBOARD.ENTRYPOINT_SHOWN',
    TENSORBOARD_INSTALL_PROMPT_SHOWN = 'TENSORBOARD.INSTALL_PROMPT_SHOWN',
    TENSORBOARD_INSTALL_PROMPT_SELECTION = 'TENSORBOARD.INSTALL_PROMPT_SELECTION',
    TENSORBOARD_DETECTED_IN_INTEGRATED_TERMINAL = 'TENSORBOARD_DETECTED_IN_INTEGRATED_TERMINAL',
    TENSORBOARD_PACKAGE_INSTALL_RESULT = 'TENSORBOARD.PACKAGE_INSTALL_RESULT',
    TENSORBOARD_TORCH_PROFILER_IMPORT = 'TENSORBOARD.TORCH_PROFILER_IMPORT',
    TENSORBOARD_JUMP_TO_SOURCE_REQUEST = 'TENSORBOARD_JUMP_TO_SOURCE_REQUEST',
    TENSORBOARD_JUMP_TO_SOURCE_FILE_NOT_FOUND = 'TENSORBOARD_JUMP_TO_SOURCE_FILE_NOT_FOUND',

    ENVIRONMENT_CREATING = 'ENVIRONMENT.CREATING',
    ENVIRONMENT_CREATED = 'ENVIRONMENT.CREATED',
    ENVIRONMENT_FAILED = 'ENVIRONMENT.FAILED',
    ENVIRONMENT_INSTALLING_PACKAGES = 'ENVIRONMENT.INSTALLING_PACKAGES',
    ENVIRONMENT_INSTALLED_PACKAGES = 'ENVIRONMENT.INSTALLED_PACKAGES',
    ENVIRONMENT_INSTALLING_PACKAGES_FAILED = 'ENVIRONMENT.INSTALLING_PACKAGES_FAILED',
    ENVIRONMENT_BUTTON = 'ENVIRONMENT.BUTTON',
    ENVIRONMENT_DELETE = 'ENVIRONMENT.DELETE',
    ENVIRONMENT_REUSE = 'ENVIRONMENT.REUSE',

    ENVIRONMENT_CHECK_TRIGGER = 'ENVIRONMENT.CHECK.TRIGGER',
    ENVIRONMENT_CHECK_RESULT = 'ENVIRONMENT.CHECK.RESULT',
}

export enum PlatformErrors {
    FailedToParseVersion = 'FailedToParseVersion',
    FailedToDetermineOS = 'FailedToDetermineOS',
}
