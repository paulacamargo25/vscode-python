export enum OSType {
    Unknown = 'Unknown',
    Windows = 'Windows',
    OSX = 'OSX',
    Linux = 'Linux',
}

export function getOSType(platform: string = process.platform): OSType {
    if (/^win/.test(platform)) {
        return OSType.Windows;
    }
    if (/^darwin/.test(platform)) {
        return OSType.OSX;
    }
    if (/^linux/.test(platform)) {
        return OSType.Linux;
    }
    return OSType.Unknown;
}
