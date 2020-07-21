/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { AsyncEither, Either, hasPermission, Maybe, MaybeObj, Member } from 'common-lib';
import * as React from 'react';
import TeamForm, {
	collapseTeamEditToObject,
	expandTeamObjectToEdit,
	TeamObjectEdit
} from '../../components/forms/usable-forms/TeamForm';
import Loader from '../../components/Loader';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

interface TeamEditLoadingState {
	state: 'LOADING';
}

interface TeamEditLoadedState {
	state: 'LOADED';
	team: TeamObjectEdit;
	memberList: Member[];
}

interface TeamEditErrorState {
	state: 'ERROR';
}

type TeamEditState = TeamEditLoadedState | TeamEditLoadingState | TeamEditErrorState;

export default class TeamEdit extends Page<PageProps<{ id: string }>, TeamEditState> {
	public state: TeamEditState = {
		state: 'LOADING'
	};

	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.onTeamChange = this.onTeamChange.bind(this);
		this.onTeamSubmit = this.onTeamSubmit.bind(this);
	}

	public async componentDidMount() {
		if (parseInt(this.props.routeProps.match.params.id, 10) === 0) {
			this.props.routeProps.history.push('/team/view/0');
		}

		if (this.props.member) {
			this.props.updateSideNav([]);
			this.props.updateBreadCrumbs([]);
			this.updateTitle();

			const teamInfoEither = await AsyncEither.All([
				fetchApi.team.get(
					{ id: this.props.routeProps.match.params.id },
					{},
					this.props.member.sessionID
				),
				fetchApi.member.memberList({}, {}, this.props.member.sessionID)
			]);

			if (Either.isLeft(teamInfoEither)) {
				return this.setState({
					state: 'ERROR'
				});
			}

			const [team, memberList] = teamInfoEither.value;

			this.setState({
				state: 'LOADED',
				team: expandTeamObjectToEdit(team),
				memberList
			});

			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: `/team/${team.id}`,
					text: `View team "${team.name}"`
				},
				{
					target: `/team/edit/${team.id}`,
					text: `Edit team "${team.name}"`
				}
			]);
			this.updateTitle(`Edit team "${team.name}"`);
		}
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>There was an error getting team or member information</div>;
		}

		// const checker = areMembersTheSame(this.props.member);
		// const leaderChecker = pipe(Maybe.map(checker), Maybe.orSome(false));

		if (
			!(
				// Server only checks for ManageTeam permission, not team leadership
				hasPermission('ManageTeam')()(this.props.member) // ||
				// leaderChecker(this.state.team.cadetLeader) ||
				// leaderChecker(this.state.team.seniorCoach) ||
				// leaderChecker(this.state.team.seniorMentor)
			)
		) {
			return <div>You do not have permission to do that</div>;
		}

		return (
			<TeamForm
				isTeamUpdate={true}
				memberList={this.state.memberList}
				onTeamChange={this.onTeamChange}
				onTeamFormSubmit={this.onTeamSubmit}
				team={this.state.team}
			/>
		);
	}

	private onTeamChange(team: TeamObjectEdit) {
		if (this.state.state !== 'LOADED') {
			return;
		}

		this.setState({
			state: 'LOADED',
			memberList: this.state.memberList,
			team
		});
	}

	private async onTeamSubmit(team: MaybeObj<TeamObjectEdit>) {
		if (!this.props.member || this.state.state !== 'LOADED') {
			return;
		}

		const newTeam = Maybe.flatMap(collapseTeamEditToObject)(team);

		if (!newTeam.hasValue) {
			return;
		}

		await fetchApi.team.set(
			{ id: this.props.routeProps.match.params.id },
			newTeam.value,
			this.props.member.sessionID
		);

		this.props.routeProps.history.push(`/team/${this.props.routeProps.match.params.id}`);
	}
}
