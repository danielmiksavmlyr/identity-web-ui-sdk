import React from 'react';
import { createRoot } from 'react-dom/client';
import type { AuthOptions, Client as CoreClient, SessionInfo } from '@reachfive/identity-core'

import { Config, Prettify } from './types'

import { I18nMessages } from './core/i18n';
import { UserError } from './helpers/errors';
import { logError } from './helpers/logger';

import { ErrorMessage } from './components/error'
import type { Context, I18nProps, ThemeProps } from './components/widget/widget'

import authWidget, { type AuthWidgetProps } from './widgets/auth/authWidget';
import emailEditorWidget, { type EmailEditorWidgetProps } from './widgets/emailEditor/emailEditorWidget';
import passwordEditorWidget, { type PasswordEditorWidgetProps } from './widgets/passwordEditor/passwordEditorWidget';
import phoneNumberEditorWidget, { type PhoneNumberEditorWidgetProps } from './widgets/phoneNumberEditor/phoneNumberEditorWidget';
import passwordResetWidget, { type PasswordResetWidgetProps } from './widgets/passwordReset/passwordResetWidget';
import passwordlessWidget, { type PasswordlessWidgetProps } from './widgets/passwordless/passwordlessWidget';
import profileEditorWidget, { type ProfileEditorWidgetProps } from './widgets/profileEditor/profileEditorWidget';
import socialAccountsWidget, { type SocialAccountsWidgetProps } from './widgets/socialAccounts/socialAccountsWidget';
import socialLoginWidget, { type SocialLoginWidgetProps } from './widgets/socialLogin/socialLoginWidget';
import webAuthnWidget, { type WebAuthnWidgetProps } from './widgets/webAuthn/webAuthnDevicesWidget';
import mfaCredentialsWidget, { type MfaCredentialsWidgetProps } from './widgets/mfa/MfaCredentialsWidget';
import mfaListWidget, { type MfaListWidgetProps } from './widgets/mfa/mfaListWidget'
import mfaStepUpWidget, { type MfaStepUpWidgetProps } from './widgets/stepUp/mfaStepUpWidget';

export interface WidgetInstance {
    destroy(): void
}

export interface WidgetProps {
    /** The DOM element or the `id` of a DOM element in which the widget should be embedded. */
    container: string | HTMLElement
     /**
     * The [ISO country](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code useful to format phone numbers.
     * Defaults to the predefined country code in your account settings or `FR`.
     */
    countryCode?: string
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container. 
     * The callback is called with the widget instance.
     */
    onReady?: (instance: WidgetInstance) => void
}

// type PropsWithWidgetProps<P> = P & WidgetProps
type WidgetOptions<P> = Prettify<P & WidgetProps & I18nProps & ThemeProps>

type Widget<P> = (props: P, ctx: Context) => Promise<React.JSX.Element>

// type WidgetOptions<W> = PropsWithWidgetProps<W extends Widget<infer P> ? P : never[0]>

export class UiClient {
    config: Config
    core: CoreClient
    defaultI18n: I18nMessages
    
    constructor(config: Config, coreClient: CoreClient, defaultI18n: I18nMessages) {
        this.config = config;
        this.core = coreClient;
        this.defaultI18n = defaultI18n;
    }

    showAuth(options: WidgetOptions<AuthWidgetProps>) {
        this._ssoCheck(authWidget, options);
    }

    showSocialLogin(options: WidgetOptions<SocialLoginWidgetProps>) {
        this._ssoCheck(socialLoginWidget, options);
    }

    showPasswordless(options: WidgetOptions<PasswordlessWidgetProps>) {
        this._ssoCheck(passwordlessWidget, options);
    }

    showEmailEditor(options: WidgetOptions<EmailEditorWidgetProps>) {
        this._showWidget(emailEditorWidget, options);
    }

    showPasswordEditor(options: WidgetOptions<PasswordEditorWidgetProps>) {
        this._showWidget(passwordEditorWidget, options);
    }

    showPhoneNumberEditor(options: WidgetOptions<PhoneNumberEditorWidgetProps>) {
        this._showWidget(phoneNumberEditorWidget, options);
    }

    showProfileEditor(options: WidgetOptions<ProfileEditorWidgetProps>) {
        this._showWidget(profileEditorWidget, options);
    }

    showPasswordReset(options: WidgetOptions<PasswordResetWidgetProps>) {
        this._showWidget(passwordResetWidget, options);
    }

    showSocialAccounts(options: WidgetOptions<SocialAccountsWidgetProps>) {
        this._showWidget(socialAccountsWidget, options);
    }

    showWebAuthnDevices(options: WidgetOptions<WebAuthnWidgetProps>) {
        this._showWidget(webAuthnWidget, options);
    }

    showMfa(options: WidgetOptions<MfaCredentialsWidgetProps>) {
        this._showWidget(mfaCredentialsWidget, options);
    }

    showStepUp(options: WidgetOptions<MfaStepUpWidgetProps>) {
        this._showWidget(mfaStepUpWidget, options)
    }

    showMfaCredentials(options: WidgetOptions<MfaListWidgetProps>) {
        this._showWidget(mfaListWidget, options);
    }

    async _showWidget<P extends WidgetProps>(widget: Widget<Omit<P, keyof WidgetProps>>, options: P = {} as P, props = {}) {
        const { container: _c1, countryCode: _c2, onReady: _c3, ...widgetProps } = options

        const container = typeof options.container === 'string'
            ? document.getElementById(options.container)
            : options.container;

        if (!container) {
            throw new Error(`Container '#${options.container}' not found.`);
        }

        try {
            const config = {
                ...this.config,
                countryCode: options.countryCode || this.config.countryCode || 'FR'
            };

            const WidgetComponent = await widget(widgetProps, {
                ...props,
                config,
                apiClient: this.core,
                defaultI18n: this.defaultI18n
            });

            const root = createRoot(container)
            root.render(WidgetComponent);

            if (options.onReady && typeof options.onReady === 'function') {
                options.onReady({
                    destroy() { root.unmount() }
                });
            }
        } catch (error) {
            const message = this.adaptError(error);
            createRoot(container).render(<ErrorMessage>{message}</ErrorMessage>)
            this.handleError(error)
        }
    }

    _ssoCheck<P extends WidgetProps>(widget: Widget<Omit<P, keyof WidgetProps>>, options: P & { auth?: AuthOptions }) {
        const { auth = {} } = options;
        const showAuthWidget = (session?: SessionInfo) => this._showWidget(widget, options, { session });
        
        if (this.config.sso || auth.idTokenHint || auth.loginHint) {
            setTimeout(() =>
                Promise.resolve(this.core.checkUrlFragment(window.location.href)).then(authResult => {
                    // Avoid authentication triggering when an authentication response is present
                    if (authResult) return;

                    this.core
                        .getSessionInfo()
                        .then(session => {
                            const reAuthenticate = auth && auth.prompt && auth.prompt === 'login'

                            if (session.isAuthenticated && !reAuthenticate) {
                                this.core.loginFromSession(auth);
                            } else {
                                showAuthWidget(session);
                            }
                        })
                        .catch(err => {
                            logError(err);
                            showAuthWidget();
                        });
                }),
                0
            );
        } else {
            showAuthWidget();
        }
    }

    adaptError(error: unknown) {
        return error instanceof UserError ? error.isUserError : error instanceof Error ? error.message : 'Unexpected error'
    }

    handleError(error: unknown) {
        if (error instanceof UserError) {
            const message = this.adaptError(error)
            logError(`ReachFive widget display fails: ${message}`);
        } else if (error instanceof Error || typeof error === 'string') {
            logError(error);
        }
    }
}
