CREATE TABLE IF NOT EXISTS `aliases` (
	`key` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`format` text NOT NULL,
	`w1` text NOT NULL,
	`w2` text,
	`l1` text NOT NULL,
	`l2` text,
	`winner_score` integer,
	`loser_score` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
