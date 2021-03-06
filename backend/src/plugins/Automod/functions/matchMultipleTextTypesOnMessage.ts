import { SavedMessage } from "../../../data/entities/SavedMessage";
import { resolveMember } from "../../../utils";
import { PluginData } from "knub";
import { AutomodPluginType } from "../types";

type TextTriggerWithMultipleMatchTypes = {
  match_messages: boolean;
  match_embeds: boolean;
  match_visible_names: boolean;
  match_usernames: boolean;
  match_nicknames: boolean;
  match_custom_status: boolean;
};

export type MatchableTextType = "message" | "embed" | "visiblename" | "username" | "nickname" | "customstatus";

type YieldedContent = [MatchableTextType, string];

/**
 * Generator function that allows iterating through matchable pieces of text of a SavedMessage
 */
export async function* matchMultipleTextTypesOnMessage(
  pluginData: PluginData<AutomodPluginType>,
  trigger: TextTriggerWithMultipleMatchTypes,
  msg: SavedMessage,
): AsyncIterableIterator<YieldedContent> {
  const member = await resolveMember(pluginData.client, pluginData.guild, msg.user_id);
  if (!member) return;

  if (trigger.match_messages && msg.data.content) {
    yield ["message", msg.data.content];
  }

  if (trigger.match_embeds && msg.data.embeds && msg.data.embeds.length) {
    const copiedEmbed = JSON.parse(JSON.stringify(msg.data.embeds[0]));
    if (copiedEmbed.type === "video") {
      copiedEmbed.description = ""; // The description is not rendered, hence it doesn't need to be matched
    }
    yield ["embed", JSON.stringify(copiedEmbed)];
  }

  if (trigger.match_visible_names) {
    yield ["visiblename", member.nick || msg.data.author.username];
  }

  if (trigger.match_usernames) {
    yield ["username", `${msg.data.author.username}#${msg.data.author.discriminator}`];
  }

  if (trigger.match_nicknames && member.nick) {
    yield ["nickname", member.nick];
  }

  // type 4 = custom status
  if (trigger.match_custom_status && member.game?.type === 4 && member.game?.state) {
    yield ["customstatus", member.game.state];
  }
}
