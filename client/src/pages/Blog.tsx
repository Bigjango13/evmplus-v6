import { convertFromRaw, convertToRaw, Editor, EditorState } from 'draft-js';
import * as React from 'react';
import { Link, Route, RouteComponentProps } from 'react-router-dom';
import Loader from '../components/Loader';
import {
	FileInput,
	Label,
	TextArea,
	TextInput
} from '../components/SimpleForm';
/// <reference path="../../../lib/index.d.ts" />
import RequestForm from '../components/SimpleRequestForm';
import myFetch from '../lib/myFetch';
import './blog.css';
import Page, { PageProps } from './Page';

class BlogList extends React.Component<
	{},
	{
		posts: BlogPostObject[];
		displayLeft: boolean;
		displayRight: boolean;
		page: number;
		loaded: boolean;
	}
> {
	constructor(props: {}) {
		super(props);
		this.state = {
			posts: [],
			page: 0,
			displayLeft: false,
			displayRight: false,
			loaded: false
		};
	}

	public componentDidMount() {
		myFetch('/api/blog/post/list/' + this.state.page)
			.then(val => val.json())
			.then(
				(posts: {
					posts: BlogPostObject[];
					displayLeft: boolean;
					displayRight: boolean;
					page: number;
				}) => {
					this.setState({
						...posts,
						loaded: true
					});
				}
			);
	}

	public render() {
		return !this.state.loaded ? (
			<Loader />
		) : this.state.posts.length === 0 ? (
			<h1>No blog posts</h1>
		) : (
			<div>
				{this.state.posts.map((post, i) => {
					return (
						<div key={i} className="blog-post">
							<Link to={'/blog/view/' + post.id}>
								<h1>{post.title}</h1>
							</Link>
							<Editor
								editorState={EditorState.createWithContent(
									convertFromRaw(post.content)
								)}
								readOnly={true}
								onChange={() => null}
							/>
						</div>
					);
				})}
			</div>
		);
	}
}

class BlogPostCreate extends React.Component<
	PageProps<any>,
	{
		title: string;
		content: EditorState;
		fileIDs: string[];
	}
> {
	public state = {
		title: '',
		content: EditorState.createEmpty(),
		fileIDs: []
	};

	public render() {
		const PostCreateForm = RequestForm as new () => RequestForm<
			{
				title: string;
				content: EditorState;
				fileIDs: string[];
			},
			BlogPostObject
		>;

		return this.props.member.valid === true ? (
			<>
				<h2>Create blog post</h2>
				<PostCreateForm
					url="/api/blog/post"
					id="blogPostCreate"
					submitInfo={{
						text: 'Create blog post',
						className: 'floatAllthewayRight'
					}}
					onSubmit={post => ({
						title: post.title,
						content: convertToRaw(post.content.getCurrentContent()),
						authorid: this.props.member.member!.object.id,
						fileIDs: post.fileIDs
					})}
					onReceiveData={post => {
						this.props.routeProps.history.push(
							'/blog/view/' + post.id
						);
					}}
				>
					<TextInput
						name="title"
						fullWidth={true}
						placeholder="Post title..."
						boxStyles={{
							margin: 0,
							padding: 0,
							marginBottom: -11
						}}
						inputStyles={{
							backgroundColor: '#fff',
							borderRadius: 0,
							padding: 10,
							borderBottomWidth: 0,
							borderColor: '#aaa'
						}}
						value={this.state.title}
						onChange={title => {
							this.setState({ title });
						}}
					/>
					<TextArea
						name="content"
						fullWidth={true}
						value={this.state.content}
						onChange={content => {
							this.setState({ content });
						}}
					/>
					<Label>Photos to display</Label>
					<FileInput
						name="fileIDs"
						value={this.state.fileIDs}
						onChange={fileIDs => {
							this.setState({ fileIDs });
						}}
					/>
				</PostCreateForm>
			</>
		) : (
			<h2>Please sign in</h2>
		);
	}
}

class BlogEdit extends React.Component<
	RouteComponentProps<{
		id: string;
	}>
> {}

class BlogView extends React.Component<
	RouteComponentProps<{
		id: string;
	}>,
	{
		post?: BlogPostObject;
	}
> {
	constructor(
		props: RouteComponentProps<{
			id: string;
		}>
	) {
		super(props);
		this.state = {
			post: undefined
		};
	}

	public componentDidMount() {
		myFetch('/api/blog/post/' + this.props.match.params.id)
			.then(val => val.json())
			.then((post: BlogPostObject) => this.setState({ post }));
	}

	public render() {
		return typeof this.state.post === 'undefined' ? (
			<Loader />
		) : (
			<div>
				<h1>{this.state.post.title}</h1>
				<Editor
					editorState={EditorState.createWithContent(
						convertFromRaw(this.state.post.content)
					)}
					onChange={() => null}
					readOnly={true}
				/>
			</div>
		);
	}
}

export default class Blog extends Page {
	public render() {
		return (
			<>
				<Route exact={true} path="/blog" component={BlogList} />
				<Route
					path="/blog/post"
					component={() => <BlogPostCreate {...this.props} />}
				/>
				<Route path="/blog/view/:id" component={BlogView} />
				<Route path="/blog/edit/:id" component={BlogEdit} />
			</>
		);
	}
}
