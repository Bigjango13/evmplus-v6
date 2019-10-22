import * as React from 'react';
import { Link } from 'react-router-dom';
import LoaderShort from '../../../components/LoaderShort';
import FileInterface from '../../../lib/File';
import Page, { PageProps } from '../../Page';

export class DriveWidget extends Page<PageProps, { list: string[] | null }> {
	public state: { list: string[] | null } = {
		list: null
	};

	public async componentDidMount() {
		const root = await FileInterface.Get('root', this.props.member, this.props.account);

		this.setState({
			list: root.fileChildren
		});
	}

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Drive information</div>
				<div className="widget-body">
					{this.state.list === null ? (
						<LoaderShort />
					) : (
						<div>
							There {this.state.list.length === 1 ? 'is' : 'are'}{' '}
							{this.state.list.length} file
							{this.state.list.length !== 1 ? 's' : ''} in the root drive
							<br />
							<br />
							<Link to="/drive">Go there now</Link>
						</div>
					)}
				</div>
			</div>
		);
	}
}
