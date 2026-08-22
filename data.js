/*
 * About My OC 的內容資料。
 * 一般使用時只需要修改這個檔案與 assets 資料夾。
 * 圖片尚未準備好時，可把 image 或 cover 留成空字串。
 */
window.OC_SITE_DATA = {
  site: {
    title: "界外檔案館",
    tagline: "Worlds, Characters & IF Lines",
    mark: "OC",
    introTitle: "選擇一個世界",
    introText: "每個世界都有自己的角色、設定與視覺風格。從角色頁可以直接進入該角色的 IF 世界線。",
    footer: "About My OC — 修改 data.js 就能建立自己的 OC 檔案館。"
  },

  worlds: [
    {
      id: "white-tower",
      name: "白塔崩毀後",
      subtitle: "THE FALLEN WHITE TOWER",
      theme: "zombie",
      symbol: "WT",
      cover: "",
      description: "病毒、哨兵嚮導、非法實驗與表裡世界交疊而成的末世。",
      facts: [
        { label: "世界類型", value: "末世／哨兵嚮導" },
        { label: "主要勢力", value: "黑環序列、灰庭協會" },
        { label: "核心事件", value: "白塔協會遭到摧毀" }
      ],
      characters: [
        {
          id: "shen-qishuang",
          name: "沈祁霜",
          englishName: "Silas",
          role: "S級哨兵／黑環序列環主",
          image: "",
          quote: "最溫柔的語氣，也可以是最後的警告。",
          tags: ["S級哨兵", "黑王蛇", "特殊實驗體"],
          profile: [
            { label: "實驗編號", value: "WT-SØ-001 · COIL" },
            { label: "精神體", value: "黑王蛇" },
            { label: "能力", value: "精神控制、精神免疫、神經毒素" },
            { label: "現職", value: "黑環序列環主／灰庭協會監事長" }
          ],
          story: [
            "前白塔協會特殊實驗體。白塔覆滅後，他同時站在表世界與裡世界的權力中心，卻無人知道兩個身分屬於同一個人。",
            "他極擅長偽裝，以溫和笑容執行最冷酷的決斷；唯有黎星澈能真正進入他的精神世界。"
          ],
          relationships: [
            { name: "黎星澈", relation: "唯一匹配嚮導", note: "精神匹配度 99.99%。" }
          ],
          ifLines: [
            {
              id: "school",
              name: "無塔校園 IF",
              theme: "school",
              role: "學生會長",
              image: "",
              divergence: "病毒與白塔從未存在。",
              description: "沒有實驗編號與組織權力的普通校園世界，但他依然習慣掌控全局。",
              quote: "今天的違規名單裡，似乎又有你的名字。",
              profile: [
                { label: "身分", value: "學生會長" },
                { label: "年級", value: "三年級" },
                { label: "與黎星澈", value: "同校學生／關係未公開" }
              ]
            }
          ]
        },
        {
          id: "li-xingche",
          name: "黎星澈",
          englishName: "Eiren",
          role: "S級嚮導／前白塔實驗體",
          image: "",
          quote: "別怕，我只是想看看你會壞成什麼樣子。",
          tags: ["S級嚮導", "狐狸", "特殊實驗體"],
          profile: [
            { label: "精神體", value: "狐狸" },
            { label: "能力", value: "操縱進入精神圖景的意識" },
            { label: "來源", value: "白塔特殊實驗計畫" },
            { label: "匹配對象", value: "沈祁霜" }
          ],
          story: [
            "他在拍賣會上被沈祁霜買下。長期實驗使他的道德與危險界線異於常人，純真的笑意常與殘酷行為同時出現。",
            "他能支配任何進入精神圖景的意識，沈祁霜卻是唯一例外。"
          ],
          relationships: [
            { name: "沈祁霜", relation: "主人／唯一滿意的對象", note: "彼此都不接受被他人取代。" }
          ],
          ifLines: [
            {
              id: "school",
              name: "無塔校園 IF",
              theme: "school",
              role: "轉學生",
              image: "",
              divergence: "病毒與白塔從未存在。",
              description: "以轉學生身分來到沈祁霜所在的學校，第一天便成功引起學生會注意。",
              quote: "學生會長，你是特地來抓我的嗎？",
              profile: [
                { label: "身分", value: "轉學生" },
                { label: "年級", value: "三年級" },
                { label: "與沈祁霜", value: "同校學生／經常被單獨留下" }
              ]
            }
          ]
        }
      ]
    },

    {
      id: "moon-shrine",
      name: "月下廢社",
      subtitle: "THE SHRINE BENEATH THE MOON",
      theme: "ancient",
      symbol: "月",
      cover: "",
      description: "年輕作家住進廢棄神社後，遇見了原以為她很快就會離開的九尾狐。",
      facts: [
        { label: "世界類型", value: "現代奇幻／神社" },
        { label: "主要地點", value: "山中廢棄神社" },
        { label: "關係氛圍", value: "如月光般安靜溫柔" }
      ],
      characters: [
        {
          id: "shuangye",
          name: "霜夜",
          englishName: "Shuangye",
          role: "棲居神社的九尾狐",
          image: "",
          quote: "既然留下來了，就別再把自己當作客人。",
          tags: ["九尾狐", "年上", "神社"],
          profile: [
            { label: "種族", value: "九尾狐" },
            { label: "居所", value: "山中廢棄神社" },
            { label: "特徵", value: "銀髮、九尾、慵懶桃花眼" },
            { label: "對宵月稱呼", value: "小月／月月" }
          ],
          story: [
            "宵月剛住進神社時，霜夜只把她視為短暫闖入的人類。他一直隱去身形觀察，認為她很快就會離開。",
            "後來兩人的生活逐漸交疊。他照顧她，也默許她黏著自己的尾巴；對霜夜而言，宵月不是耀眼的陽光，而是能長久相伴的月光。"
          ],
          relationships: [
            { name: "宵月", relation: "戀人／神社的另一位主人", note: "總會接住她自然流露的撒嬌。" }
          ],
          ifLines: []
        },
        {
          id: "xiaoyue",
          name: "宵月",
          englishName: "Xiaoyue",
          role: "住進神社的年輕作家",
          image: "",
          quote: "我只是靠一下尾巴，不會妨礙你吧？",
          tags: ["作家", "人類", "喜歡毛茸茸"],
          profile: [
            { label: "種族", value: "人類" },
            { label: "職業", value: "作家" },
            { label: "性格", value: "有人搭話時活潑，獨處時安靜" },
            { label: "喜歡", value: "毛茸茸與霜夜的尾巴" }
          ],
          story: [
            "因交不起房租，她搬進一座被人遺忘的神社。她並不知道自己的一舉一動，早已被神社真正的主人看在眼裡。",
            "宵月有眼力見，也不會刻意打擾別人；但在霜夜身邊，她會很自然地撒嬌，偶爾像個安心依賴大人的孩子。"
          ],
          relationships: [
            { name: "霜夜", relation: "戀人／最安心的歸處", note: "喜歡靠著他的尾巴寫稿或睡覺。" }
          ],
          ifLines: []
        }
      ]
    }
  ]
};
