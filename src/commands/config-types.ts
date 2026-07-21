/** Describes values accepted by setup and config-set operations. */
export interface ConfigSetOptions {
  apiUrl?: string;
  apiKey?: string;
  userEmail?: string;
  userPassword?: string;
  defaultFormat?: string;
  readOnly?: boolean;
  readWrite?: boolean;
  dryRun?: boolean;
  nonInteractive?: boolean;
  probeCapabilities?: boolean;
  skipCapabilityProbe?: boolean;
}
