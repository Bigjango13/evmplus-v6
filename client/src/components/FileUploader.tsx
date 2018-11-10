import { HTTPError } from '../enums';
import * as React from 'react';
import FileInterface from '../lib/File';
import MemberBase from '../lib/Members';
import Account from '../lib/Account';

interface FileUploaderProps {
	onFileUpload: (file: FileInterface) => void;
	member: MemberBase;
	account: Account | null;
	currentFolder: FileInterface;
	display: boolean;
}

interface FileUploaderState {
	files: File[];
	hovering: boolean;
	progress: number;
	doneWithCurrentFile: boolean;
	error: HTTPError;
}

export default class FileUploader extends React.Component<
	FileUploaderProps,
	FileUploaderState
> {
	public state: FileUploaderState = {
		files: [],
		hovering: false,
		progress: 0,
		doneWithCurrentFile: false,
		error: HTTPError.NONE
	};

	public constructor(props: FileUploaderProps) {
		super(props);
	}

	public async componentDidUpdate() {
		// Don't start uploading if it is currently uploading the first file
		if (!this.state.doneWithCurrentFile && this.state.files.length > 0) {
			return;
		}

		// Don't try to upload if there aren't files to upload
		if (this.state.files.length === 0) {
			return;
		}

		this.setState({
			doneWithCurrentFile: false
		});

		const account = this.props.account || (await Account.Get());

		const fileUploader = FileInterface.Create(
			this.state.files[0],
			this.props.currentFolder,
			this.props.member,
			account
		);

		fileUploader.progressListeners.push(progress => {
			this.setState({
				progress
			});
		});

		fileUploader.finishListeners.push(fileInterface => {
			this.props.onFileUpload(fileInterface);
			this.setState(prev => ({
				files: prev.files.slice(1),
				doneWithCurrentFile: true,
				progress: 0
			}));
		});
	}

	public render() {
		return (
			<>
				<div>
					{this.state.files.length > 0 ? (
						<div>Uploading files</div>
					) : null}
					{this.state.files.map((f, i) => (
						<div key={i}>
							{f.name} {i === 0 ? this.state.progress * 100 : 0}%
						</div>
					))}
				</div>
				<div
					id="fileDialogueUpload"
					onDrop={this.handleDrop}
					onDragOver={this.getDropOverChanger(true)}
					onDragExit={this.getDropOverChanger(false)}
					onDragEnd={this.getDropOverChanger(false)}
					onDragLeave={this.getDropOverChanger(false)}
					style={{
						backgroundColor: this.state.hovering
							? '#b4d1ff'
							: '#fff',
						borderColor: this.state.hovering ? '#3079ed' : '#999',
						borderWidth: 2,
						borderStyle: 'dashed',
						padding: 30,
						display: this.props.display ? 'block' : 'none'
					}}
				>
					<div
						style={{
							margin: '0px auto',
							overflow: 'auto',
							textAlign: 'center',
							clear: 'both'
						}}
						className="verticalCenter"
					>
						Drag here to upload
						<br />
						or
						<br />
						<label
							htmlFor="fileUpload"
							id="fileUploadLabel"
							className="primaryButton"
							style={{
								display: 'inline-block',
								margin: '2px auto'
							}}
						>
							Select files to upload
						</label>
						<input
							id="fileUpload"
							type="file"
							multiple={true}
							style={{
								width: 0.1,
								height: 0.1,
								opacity: 0,
								overflow: 'hidden',
								position: 'fixed',
								left: -20,
								zIndex: -1
							}}
							onChange={this.handleSelectChange}
						/>
					</div>
				</div>
			</>
		);
	}

	private getDropOverChanger(hovering: boolean) {
		return ((e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			this.setState({
				hovering
			});
		}).bind(this);
	}

	private handleDrop(ev: React.DragEvent<HTMLDivElement>) {
		ev.preventDefault();

		if (ev.dataTransfer.files) {
			this.handleFiles(ev.dataTransfer.files);
		} else if (ev.dataTransfer.items) {
			const files = [];
			// I don't think a for of loop would work with dataTransfer.items
			// tslint:disable-next-line:prefer-for-of
			for (let i = 0; i < ev.dataTransfer.items.length; i++) {
				if (ev.dataTransfer.items[i].kind === 'file') {
					files.push(ev.dataTransfer.items[i].getAsFile());
				}
			}
			this.handleFiles((files as any) as FileList);
		}

		this.setState({
			hovering: false
		});
	}

	private handleSelectChange(ev: React.FormEvent<HTMLInputElement>) {
		const files = ev.currentTarget.files;

		if (files === null || typeof files === 'undefined') {
			return;
		}

		this.handleFiles(files);
	}

	private handleFiles(files: FileList) {
		const uploadingFiles = this.state.files.slice();

		// FileList does not implement Iterator, would not work with for-of
		// tslint:disable-next-line:prefer-for-of
		for (let i = 0; i < files.length; i++) {
			uploadingFiles.push(files[i]);
		}

		this.setState({ files: uploadingFiles });
	}
}
