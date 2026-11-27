import { countOtherSessions, requireUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    return { otherSessions: await countOtherSessions(event, user.id) };
});
