import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Registry from 'src/lib/Registry';
import { BreadCrumb } from '../components/BreadCrumbs';
import { SideNavigationItem } from '../components/SideNavigation';
import Account from '../lib/Account';
import MemberBase from '../lib/MemberBase';

// DO NOT USE THIS COMPONENT
// Other pages extend this so that I can use `typeof Page` in route composition

export interface PageProps<R = {}> {
	member: MemberBase | null;
	account: Account;
	routeProps: RouteComponentProps<R>;
	registry: Registry;
	fullMemberDetails: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
	updateSideNav: (links: SideNavigationItem[], force?: boolean) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
}

export default abstract class Page<
	P extends PageProps = PageProps,
	S = {},
	SS = {}
> extends React.Component<P, S, SS> {
	protected isShallowOk = false;

	private force = false;

	public shouldComponentUpdate(nextProps: P, nextState: S) {
		const nextSID = nextProps.member ? nextProps.member.sessionID : '';
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		const areStatesEqual = this.isShallowOk
			? shallowCompare(nextState, this.state)
			: deepCompare(nextState, this.state);

		const shouldUpdate =
			this.force ||
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextSID !== currentSID ||
			nextProps.routeProps.location.pathname !==
				this.props.routeProps.location.pathname ||
			nextProps.routeProps.location.hash !==
				this.props.routeProps.location.hash ||
			!areStatesEqual;

		this.force = false;

		return shouldUpdate;
	}

	public setState<K extends keyof S>(
		state:
			| ((
					prevState: Readonly<S>,
					props: Readonly<P>
			  ) => Pick<S, K> | S | null)
			| (Pick<S, K> | S | null),
		callback?: () => void
	) {
		this.force = true;
		super.setState(state, callback);
	}

	public abstract render(): JSX.Element | null;
}

const shallowCompare = <T extends {}>(a: T, b: T) => {
	let same = true;

	if (a === null && b !== null) {
		return false;
	}
	if (b === null && a !== null) {
		return false;
	}
	if (a === null && b === null) {
		return true;
	}

	for (const i in a) {
		if (a.hasOwnProperty(i)) {
			if (a[i] !== b[i]) {
				same = false;
				break;
			}
		}
	}

	return same;
};

const deepCompare = <T extends {}>(a: T, b: T) => {
	let same = true;

	if (a === null && b !== null) {
		return false;
	}
	if (b === null && a !== null) {
		return false;
	}
	if (a === null && b === null) {
		return true;
	}

	for (const i in a) {
		if (a.hasOwnProperty(i)) {
			if (typeof a[i] === 'object' && typeof b[i] === 'object') {
				if (!deepCompare(a[i], b[i])) {
					same = false;
					break;
				}
			} else if (a[i] !== b[i]) {
				same = false;
				break;
			}
		}
	}

	return same;
};
