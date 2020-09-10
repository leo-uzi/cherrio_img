const fs = require('fs')
const cheerio = require('cheerio')
const axios = require('axios')
const path = require('path')
const baseUrl = 'https://www.doutula.com/article/list/?page=1'
    // 获取需要爬取总页数
async function getPagenum() {
    const { data } = await axios.get(baseUrl)
    let $ = cheerio.load(data)
    const liLenght = $('#home .text-center li').length
    let pagenum = $('#home .text-center li').eq(liLenght - 2).find('a').text()
    return pagenum
}
// 设置定时器
function setTime(second) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('定时器成功执行')
        }, second)
    })
}
// 获取爬取图片组的信息数据
async function getAllImg() {
    let pagenum = await getPagenum()
    for (var i = 1; i <= pagenum; i++) {
        await setTime(1000 * i)
        const res = await axios.get('https://www.doutula.com/article/list/?page=' + i)
        if (res) {
            let $ = cheerio.load(res.data)
            $('#home .col-sm-9>a').each((i, ele) => {
                let urlClass = $(ele).prop('href')
                let title = $(ele).find('.random_title').text()
                let regTitle = /(.*?)\d/
                title = regTitle.exec(title)[1]
                fs.mkdir('./img/' + title, (err => {
                    if (err) {
                        console.log(err)
                    }
                }))
                getListImg(urlClass, title)
            })
        }
    }
}

// 同步获取单个图片详细数据并写入本地
async function getListImg(url, title) {
    await setTime(100)
    const { data } = await axios.get(url)
    let $ = cheerio.load(data)
    $('.container .pic-content .artile_des a').each((i, ele) => {
        let imgUrl = $(ele).find('img').prop('src')
        let imgUrlParse = path.parse(imgUrl)
        let ws = fs.createWriteStream(`./img/${title}/${title}-${i+1}${imgUrlParse.ext}`)
        axios.get(imgUrl, { responseType: 'stream' }).then(res => {
            res.data.pipe(ws)
            res.data.on('close', () => {
                console.log('写入流完成')
            })
        })
    })
}
getAllImg()