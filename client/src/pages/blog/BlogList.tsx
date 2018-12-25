import * as React from 'react';
import { Link } from 'react-router-dom';
import Pager from 'src/components/Pager';
import BlogPost from 'src/lib/BlogPost';
import Loader from '../../components/Loader';
import { DraftJS } from '../Blog';
import { PageProps } from '../Page';

export interface BlogListState1 {
	posts: null;
	displayLeft: boolean;
	displayRight: boolean;
	page: number;
	loaded: false;
	draft: null;
}

export interface BlogListState2 {
	posts: BlogPost[];
	displayLeft: boolean;
	displayRight: boolean;
	page: number;
	loaded: true;
	draft: DraftJS;
}

type BlogListProps = PageProps<{ page?: string }>;

export class BlogList extends React.Component<
	BlogListProps,
	BlogListState1 | BlogListState2
> {
	constructor(props: BlogListProps) {
		super(props);
		this.state = {
			posts: null,
			page: parseInt(this.props.routeProps.match.params.page || '1', 10),
			displayLeft: false,
			displayRight: false,
			loaded: false,
			draft: null
		};
		this.changePageNumber = this.changePageNumber.bind(this);
	}
	public componentDidMount() {
		const page = this.props.routeProps.match.params.page;
		if (page) {
			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: '/news',
					text: 'News'
				},
				{
					target: '/news/page/' + page,
					text: 'Page ' + page
				}
			]);
			const pageURL = `/news/page/${page}`;
			if (this.props.routeProps.location.pathname !== pageURL) {
				this.props.routeProps.history.replace(pageURL);
			}
			this.setState({
				page: parseInt(page.toString(), 10)
			});
		} else {
			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: '/news',
					text: 'News'
				}
			]);
		}
		Promise.all([
			this.props.account.getBlogPosts(),
			import('draft-js')
		]).then(([posts, draft]) => {
			this.setState({
				loaded: true,
				posts,
				draft
			});
			const start =
				(parseInt(page || '1', 10) - 1) *
				this.props.registry.Blog.BlogPostsPerPage;
			if (start > posts.length || start < 0) {
				return;
			}
			const renderDataset: BlogPost[] = [];
			for (
				let i = start;
				i < posts.length &&
				i < this.props.registry.Blog.BlogPostsPerPage + start;
				i++
			) {
				renderDataset.push(posts[i]);
			}
			this.props.updateSideNav(
				renderDataset.map((post, i) => ({
					target: i.toString(),
					type: 'Reference' as 'Reference',
					text: post.title
				})),
				true
			);
		});
	}
	public render() {
		if (!this.state.loaded) {
			return <Loader />;
		}
		const draft = this.state.draft;
		const Editor = draft.Editor;
		const PostPager = Pager as new () => Pager<BlogPost>;
		return (
			<div>
				{this.props.member && this.props.member.canManageBlog() ? (
					<Link to="/news/post">Create post</Link>
				) : null}
				{this.state.posts.length === 0 ? (
					<h1>No blog posts</h1>
				) : (
					<PostPager
						dataCountPerPage={this.props.registry.Blog.BlogPostsPerPage}
						dataset={this.state.posts}
						onChangePageNumber={this.changePageNumber}
						page={this.state.page}
						renderFunction={post => (
							<div className="blog-post">
								<Link to={`/news/view/${post.id}`}>
									<h1>{post.title}</h1>
								</Link>
								<Editor
									editorState={draft.EditorState.createWithContent(
										draft.convertFromRaw(post.content)
									)}
									readOnly={true}
									onChange={() => void 0}
								/>
							</div>
						)}
					/>
				)}
			</div>
		);
	}
	private changePageNumber(page: number, posts: BlogPost[]) {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/news',
				text: 'News'
			},
			{
				target: '/news/page/' + page,
				text: 'Page ' + page
			}
		]);
		const pageURL = `/news/page/${page}`;
		if (this.props.routeProps.location.pathname !== pageURL) {
			this.props.routeProps.history.replace(pageURL);
		}
		this.setState({
			page
		});
		this.props.updateSideNav(
			posts.map((post, i) => ({
				target: i.toString(),
				type: 'Reference' as 'Reference',
				text: post.title
			})),
			true
		);
	}
}
