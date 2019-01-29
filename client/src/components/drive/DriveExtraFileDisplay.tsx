import * as React from 'react';
import { FileUserAccessControlPermissions } from '../../enums';
import FileInterface from '../../lib/File';
import MemberBase from '../../lib/Members';
import Button from '../Button';
import Form, { BigTextBox, Label } from '../forms/Form';

export interface ExtraDisplayProps {
	file: FileInterface;
	member: MemberBase | null;
	childRef: React.RefObject<HTMLDivElement>;
	fileDelete: (file: FileObject) => void;
	fileModify: (file: FileObject) => void;
}

export interface CommentsForm {
	comments: string;
}

export default class ExtraFileDisplay extends React.Component<
	ExtraDisplayProps,
	CommentsForm
> {
	public state = {
		comments: this.props.file.comments
	};

	constructor(props: ExtraDisplayProps) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
		this.onFileChangeFormSubmit = this.onFileChangeFormSubmit.bind(this);

		this.onDeleteFileClick = this.onDeleteFileClick.bind(this);
	}

	public render() {
		const FileChangeForm = Form as new () => Form<CommentsForm>;

		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				{this.props.file.hasPermission(
					this.props.member,
					FileUserAccessControlPermissions.DELETE
				) ? (
					<>
						<Button
							buttonType="none"
							onClick={this.onDeleteFileClick}
						>
							Delete file
						</Button>
						<br />
						<br />
					</>
				) : null}
				<h3>Comments:</h3>
				{this.props.file.hasPermission(
					this.props.member,
					// tslint:disable-next-line:no-bitwise
					FileUserAccessControlPermissions.COMMENT |
						FileUserAccessControlPermissions.MODIFY
				) ? (
					<FileChangeForm
						id=""
						values={{ comments: this.props.file.comments }}
						onChange={this.onFormChange}
						onSubmit={this.onFileChangeFormSubmit}
						showSubmitButton={true}
					>
						<Label>Comments</Label>
						<BigTextBox name="comments" />
					</FileChangeForm>
				) : (
					this.props.file.comments
				)}
			</div>
		);
	}

	private onFormChange(formState: CommentsForm) {
		this.props.file.comments = formState.comments;
		this.props.fileModify(this.props.file);
	}

	private onDeleteFileClick() {
		if (this.props.member) {
			this.props.file.delete(this.props.member).then(() => {
				this.props.fileDelete(this.props.file);
			});
		}
	}

	private onFileChangeFormSubmit(formState: CommentsForm) {
		this.props.file.comments = formState.comments;

		if (this.props.member) {
			this.props.file.save(this.props.member).then(() => {
				this.props.fileModify(this.props.file);
			});
		}
	}
}
