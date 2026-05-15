import { parseLiveMetadataRaw } from "../lib/liveMetadata.ts";

const raw = '{"metadata":"Lost Frequencies & Bastille - Head Down"}';
console.log(parseLiveMetadataRaw(raw));
