export interface BitmojiBackgroundURL {
	type: string;
	background_url: string;
}

export enum Direction {
	Outgoing = 'OUTGOING',
}

export interface Device {
	out_beta: string;
	version: number;
}

export interface FideliusInfo {
	devices: Device[];
}

export interface Friendmoji {
	category_name: string;
}

/**
 * The type of a friend on Snapchat as of 24/09/2023
 */
export interface Friend {
	name: string;
	user_id: string;
	type: number;
	display: string;
	birthday?: string;
	ts: number;
	reverse_ts?: number;
	direction: Direction;
	can_see_custom_stories: boolean;
	expiration: number;
	friendmoji_string: string;
	friendmojis: Friendmoji[];
	snap_streak_count: number;
	bitmoji_avatar_id?: string;
	bitmoji_selfie_id?: string;
	fidelius_info?: FideliusInfo;
	is_popular: boolean;
	is_story_muted: boolean;
	mutable_username: string;
	is_cameos_sharing_supported?: boolean;
	bitmoji_scene_id?: string;
	bitmoji_background_id?: string;
	is_bitmoji_friendmoji_sharing_supported?: boolean;
	cameos_sharing_policy: number;
	plus_badge_visibility: number;
	ignored_link?: boolean;
	snap_pro_id?: string;
	post_view_emoji?: string;
	bitmoji_background_url?: BitmojiBackgroundURL;
}
