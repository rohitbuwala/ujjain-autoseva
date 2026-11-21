type Hello = {
  ok?: number; isWritablePrimary?: boolean; setName?: string; me?: string; primary?: string;
  hosts?: string[]; passives?: string[]; arbiters?: string[];
};
type Config = {
  ok?: number; config?: { _id?: string; members?: { host?: string; arbiterOnly?: boolean }[] };
};

// Pure validation, shared with offline tests. No connection or environment loading.
export function assertLocalNotificationDrain(database: string, hello: Hello, config: Config) {
  const host = "127.0.0.1:27018";
  const advertised = [...(hello.hosts ?? []), ...(hello.passives ?? []), ...(hello.arbiters ?? [])];
  const members = config.config?.members;
  if (database !== "ujjain_autoseva_local_test" || hello.ok !== 1 || hello.isWritablePrimary !== true ||
      hello.setName !== "uasLocalRs" || hello.me !== host || hello.primary !== host ||
      advertised.length !== 1 || advertised[0] !== host || config.ok !== 1 ||
      config.config?._id !== "uasLocalRs" || members?.length !== 1 || members[0].host !== host || members[0].arbiterOnly) {
    throw new Error("Local replica-set guard failed");
  }
}
