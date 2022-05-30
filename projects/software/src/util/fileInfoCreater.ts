import * as fs from 'fs';
import * as pathModule from 'path';

export function createFileInfo(str: string, suffix: string = ''): FileInfo[] {
    if (fs.statSync(str).isFile()) {
        return [
            new FileInfo(pathModule.dirname(str), pathModule.basename(str)),
        ];
    } else {
        return fs
            .readdirSync(str)
            .filter((file) => {
                return new RegExp(`\\w+\\.${suffix}`).test(file);
            })
            .map(
                (file) =>
                    new FileInfo(
                        `${pathModule.dirname(str)}/${pathModule.basename(
                            str
                        )}`,
                        file
                    )
            );
    }
}

export class FileInfo {
    private _basename: string;
    private _path: string;

    constructor(directory: string, basename: string) {
        this._basename = basename;
        this._path = `${directory}/${basename}`;
    }

    get basename(): string {
        return this._basename;
    }

    get path(): string {
        return this._path;
    }
}
