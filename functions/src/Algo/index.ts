
export const generateKeywords = function (data:string) {
    let keywords:Array<string> = [];
    let curName = '';
    data.toLowerCase().split('').forEach(alpha => {
           curName += alpha;
           keywords.push(curName);
    });
    return keywords
};