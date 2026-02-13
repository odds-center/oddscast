export interface EntrySheetItemDto {
    meet: string;
    rcDate: string;
    rcDay: string;
    rcNo: string;
    chulNo: string;
    hrName: string;
    hrNameEn: string;
    hrNo: string;
    prd: string;
    sex: string;
    age: string;
    wgBudam: string;
    rating: string;
    jkName: string;
    jkNameEn: string;
    jkNo: string;
    trName: string;
    trNo: string;
    owName: string;
    owNo: string;
    rcDist: string;
    dusu: string;
    rank: string;
    stTime: string;
    budam: string;
    rcName: string;
    chaksun1: string;
    chaksunT: string;
    rcCntT: string;
    ord1CntT: string;
}
export interface EntrySheetResponseDto {
    response: {
        header: {
            resultCode: string;
            resultMsg: string;
        };
        body: {
            items: {
                item: EntrySheetItemDto[] | EntrySheetItemDto;
            };
            numOfRows: string;
            pageNo: string;
            totalCount: string;
        };
    };
}
