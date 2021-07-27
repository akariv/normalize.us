export class ImageItem {
    id: string;
    image: string;
    tournaments: number;
    votes: number;
    descriptor: number[];
    landmarks: number[];
}

export class GridItem extends ImageItem {
    pos: {
        x: number;
        y: number;
    }
}