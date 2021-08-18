export class ImageItem {
    id: string;
    image: string;
    tournaments: number;
    votes: number;
    descriptor: number[];
    landmarks: number[];
    gender_age: {gender: string; genderProbability: number; age: number};
}

export class GridItem {
    pos: {
        x: number;
        y: number;
    };
    item: ImageItem;
}