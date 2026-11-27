import { getPublicServers } from "../../utils/publicServers";

export default defineEventHandler(async () => ({ servers: await getPublicServers() }));
