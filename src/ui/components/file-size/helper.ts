const UNITS_SI = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
const UNITS_BI = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];

export default function fileSize([ bytes ]: [ number ], { si = false }): string {
    let thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    let units = si ? UNITS_SI : UNITS_BI;
    let u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);

    return `${bytes.toFixed(1)} ${units[u]}`;
};
