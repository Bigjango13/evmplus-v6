import { Either, isRioux, Member, toReference } from 'common-lib';
import React from 'react';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import LoaderShort from '../../../components/LoaderShort';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

interface SuLoadingState {
	state: 'LOADING';
}

interface SuLoadedState {
	state: 'LOADED';

	members: Member[];
}

interface SuErrorState {
	state: 'ERROR';

	message: string;
}

type SuState = SuLoadedState | SuLoadingState | SuErrorState;

export const canUseSu = (props: PageProps) => !!props.member && isRioux(props.member);

export default class SuWidget extends Page<PageProps, SuState> {
	public state: SuState = {
		state: 'LOADING'
	};

	public constructor(props: PageProps) {
		super(props);

		this.suMember = this.suMember.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		const members = await fetchApi.member.memberList({}, {}, this.props.member.sessionID);

		if (members.direction === 'left') {
			this.setState({
				state: 'ERROR',
				message: members.value.message
			});
		} else {
			this.setState({
				state: 'LOADED',
				members: members.value
			});
		}
	}

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Su</div>
				<div className="widget-body">
					{this.state.state === 'LOADING' ? (
						<LoaderShort />
					) : this.state.state === 'ERROR' ? (
						<div>{this.state.message}</div>
					) : (
						<div>
							There are {this.state.members.length} members in your unit
							<br />
							<br />
							<MemberSelectorButton
								useShortLoader={true}
								memberList={Promise.resolve(this.state.members)}
								title="Select member"
								displayButtons={DialogueButtons.OK_CANCEL}
								labels={['Select', 'Cancel']}
								onMemberSelect={this.suMember}
								buttonType="none"
							>
								Select a member
							</MemberSelectorButton>
						</div>
					)}
				</div>
			</div>
		);
	}

	private async suMember(member: Member | null) {
		if (!member || !this.props.member) {
			return;
		}

		const newMember = await fetchApi.member
			.su({}, toReference(member), this.props.member.sessionID)
			.flatMap(() => fetchApi.check({}, {}, localStorage.getItem('sessionID')!));

		if (Either.isLeft(newMember)) {
			this.setState({
				state: 'ERROR',
				message: newMember.value.message
			});
		} else {
			this.props.authorizeUser(newMember.value);
		}
	}
}
