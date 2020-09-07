/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { always, Either, MemberCreateError } from 'common-lib';
import React from 'react';
import { Link } from 'react-router-dom';
import PasswordForm from '../../components/form-inputs/PasswordForm';
import ReCAPTCHAInput from '../../components/form-inputs/ReCAPTCHA';
import SimpleForm, { Label, TextBox, TextInput, Title } from '../../components/forms/SimpleForm';
import fetchApi from '../../lib/apis';
import { getMember } from '../../lib/Members';
import Page, { PageProps } from '../Page';

interface ResetPasswordFormValues {
	password: string;
}

interface SigninFormValues {
	username: string;
	password: string;
	recaptcha: string | null;
}

interface MFAFormValues {
	token: string;
}

interface SigninState {
	signinFormValues: SigninFormValues;
	resetFormValues: ResetPasswordFormValues;
	mfaFormValues: MFAFormValues;
	error: MemberCreateError;
	passwordSetResult: string;
	mfaResult: string;
	updatePasswordSessionID: string | null;
	finishMFASessionID: string | null;
	tryingSignin: boolean;
	tryingPasswordReset: boolean;
	tryingMFAToken: boolean;
}

const signinErrorMessages = {
	[MemberCreateError.NONE]: '',
	[MemberCreateError.INCORRRECT_CREDENTIALS]: 'The username and password could not be verified',
	[MemberCreateError.INVALID_SESSION_ID]: 'Invalid session',
	[MemberCreateError.PASSWORD_EXPIRED]: '',
	[MemberCreateError.ACCOUNT_USES_MFA]: '',
	[MemberCreateError.SERVER_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.UNKOWN_SERVER_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.DATABASE_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.RECAPTCHA_INVALID]: 'Invalid reCAPTCHA',
};

const validateNotEmpty = (val: string | null) => !!val;

const validateNewPasswords = (val: string, others: ResetPasswordFormValues) => !!val;

export default class Signin extends Page<PageProps<{ returnurl?: string }>, SigninState> {
	public state: SigninState = {
		signinFormValues: {
			username: '',
			password: '',
			recaptcha: null,
		},
		resetFormValues: {
			password: '',
		},
		error: MemberCreateError.NONE,
		passwordSetResult: '',
		updatePasswordSessionID: null,
		tryingSignin: false,
		tryingPasswordReset: false,
		mfaFormValues: {
			token: '',
		},
		mfaResult: '',
		finishMFASessionID: null,
		tryingMFAToken: false,
	};

	private get returnUrl(): string {
		const search = this.props.routeProps.location.search.replace(/\?/g, '');

		const params: { [key: string]: string } = {};

		for (const paramPair of search.split('&')) {
			params[paramPair.split('=')[0]] = decodeURIComponent(paramPair.split('=')[1]);
		}

		return params.returnurl || '/';
	}

	public constructor(props: PageProps) {
		super(props);

		this.trySignin = this.trySignin.bind(this);
		this.resetPassword = this.resetPassword.bind(this);
		this.useMFAToken = this.useMFAToken.bind(this);
	}

	public componentDidMount() {
		if (this.props.member) {
			this.props.routeProps.history.push(this.returnUrl);
		}
	}

	public render() {
		return this.state.error !== MemberCreateError.PASSWORD_EXPIRED &&
			this.state.error !== MemberCreateError.ACCOUNT_USES_MFA ? (
			<div>
				Enter your EvMPlus.org login information below to sign in to the site. By logging
				into this site you agree to the terms and conditions located{' '}
				<Link to="/terms-and-conditions">here</Link>. Our Privacy Policy may be accessed at{' '}
				<Link to="/privacy-policy">this page</Link>.
				<br />
				<br />
				Don't have an account with us? <Link to="/create-account">Create one here</Link>
				<br />
				Forget your username? <Link to="/usernamerequest">Request it here</Link>
				<br />
				Forget your password? <Link to="/passwordreset">Reset your password</Link>
				<br />
				<SimpleForm<SigninFormValues>
					onSubmit={this.trySignin}
					onChange={signinFormValues => this.setState({ signinFormValues })}
					values={this.state.signinFormValues}
					validator={{
						username: validateNotEmpty,
						password: validateNotEmpty,
						recaptcha: validateNotEmpty,
					}}
					submitInfo={{
						text: 'Sign in',
						disabled: this.state.tryingSignin,
					}}
					disableOnInvalid={true}
				>
					<Title>Sign in</Title>

					{this.state.error !== MemberCreateError.NONE ? <Label /> : null}
					{this.state.error !== MemberCreateError.NONE ? (
						<TextBox>
							<b style={{ color: 'red' }}>{signinErrorMessages[this.state.error]}</b>
						</TextBox>
					) : null}

					<Label>Username</Label>
					<TextInput name="username" />

					<Label>Password</Label>
					<TextInput name="password" password={true} />

					<ReCAPTCHAInput name="recaptcha" />
				</SimpleForm>
			</div>
		) : this.state.error === MemberCreateError.ACCOUNT_USES_MFA ? (
			<div>
				<SimpleForm<MFAFormValues>
					onSubmit={this.useMFAToken}
					validator={{
						token: token => token.length === 6 && !isNaN(parseInt(token, 10)),
					}}
					onChange={mfaFormValues => this.setState({ mfaFormValues })}
					values={this.state.mfaFormValues}
					disableOnInvalid={true}
					submitInfo={{
						text: 'Submit challenge',
						disabled: this.state.tryingMFAToken,
					}}
				>
					<Title>Multi-factor challenge</Title>

					{this.state.mfaResult !== '' ? <Label /> : null}
					{this.state.mfaResult !== '' ? (
						<TextBox>
							<b>{this.state.mfaResult}</b>
						</TextBox>
					) : null}

					<Label>Please input a multi-factor token</Label>
					<TextInput name="token" />
				</SimpleForm>
			</div>
		) : (
			<div>
				<SimpleForm<ResetPasswordFormValues>
					onSubmit={this.resetPassword}
					validator={{
						password: validateNewPasswords,
					}}
					submitInfo={{
						text: 'Update password',
						disabled: this.state.tryingPasswordReset,
					}}
					values={this.state.resetFormValues}
					onChange={resetFormValues => this.setState({ resetFormValues })}
					disableOnInvalid={true}
				>
					<Title>Reset password</Title>

					<Label />
					<TextBox>Your password has expired and needs to be reset</TextBox>

					{this.state.passwordSetResult !== '' ? <Label /> : null}
					{this.state.passwordSetResult !== '' ? (
						<TextBox>
							<b>{this.state.passwordSetResult}</b>
						</TextBox>
					) : null}

					<PasswordForm fullWidth={true} name="password" />
				</SimpleForm>
			</div>
		);
	}

	private async trySignin() {
		this.setState({
			tryingSignin: true,
			error: MemberCreateError.NONE,
		});

		if (!this.state.signinFormValues.recaptcha) {
			return;
		}

		const signinResults = await fetchApi
			.signin(
				{},
				{
					username: this.state.signinFormValues.username,
					password: this.state.signinFormValues.password,
					recaptcha: this.state.signinFormValues.recaptcha,
				},
			)
			.leftFlatMap(always(Either.right({ error: MemberCreateError.UNKOWN_SERVER_ERROR })))
			.fullJoin();

		if (signinResults.error === MemberCreateError.NONE) {
			this.props.authorizeUser(signinResults);
			this.props.routeProps.history.push(this.returnUrl);
		} else if (signinResults.error === MemberCreateError.PASSWORD_EXPIRED) {
			this.setState({
				error: signinResults.error,
				tryingSignin: false,
				updatePasswordSessionID: signinResults.sessionID,
			});
		} else if (signinResults.error === MemberCreateError.ACCOUNT_USES_MFA) {
			this.setState({
				error: signinResults.error,
				tryingSignin: false,
				finishMFASessionID: signinResults.sessionID,
			});
		} else {
			// @ts-ignore
			window.grecaptcha.reset();
			this.setState({
				error: signinResults.error,
				tryingSignin: false,
			});
		}
	}

	private async resetPassword() {
		this.setState({
			tryingPasswordReset: true,
		});

		const resetPasswordResult = await fetchApi.member.passwordReset(
			{},
			{ password: this.state.resetFormValues.password },
			this.state.updatePasswordSessionID!,
		);

		if (Either.isLeft(resetPasswordResult)) {
			this.setState({
				passwordSetResult: resetPasswordResult.value.message,
				tryingPasswordReset: false,
			});
		} else {
			const member = await getMember(this.state.updatePasswordSessionID!);

			this.props.authorizeUser(member);
			this.props.routeProps.history.push(this.returnUrl);
		}
	}

	private async useMFAToken() {
		this.setState({
			tryingMFAToken: true,
		});

		const mfaTokenResult = await fetchApi.member.session.finishMFA(
			{},
			{ mfaToken: this.state.mfaFormValues.token },
			this.state.finishMFASessionID!,
		);

		if (Either.isLeft(mfaTokenResult)) {
			this.setState({
				mfaResult: mfaTokenResult.value.message,
				tryingMFAToken: false,
			});
		} else {
			if (mfaTokenResult.value === MemberCreateError.NONE) {
				const member = await getMember(this.state.finishMFASessionID!);

				this.props.authorizeUser(member);
				this.props.routeProps.history.push(this.returnUrl);
			} else {
				this.setState({
					error: MemberCreateError.PASSWORD_EXPIRED,
					tryingMFAToken: false,
					updatePasswordSessionID: this.state.finishMFASessionID,
				});
			}
		}
	}
}
