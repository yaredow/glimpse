package tmdb

var CuratedLanguages = []Language{
	{ISOCode: "en", EnglishName: "English", Name: "English"},
	{ISOCode: "ja", EnglishName: "Japanese", Name: "日本語"},
	{ISOCode: "ko", EnglishName: "Korean", Name: "한국어/조선말"},
	{ISOCode: "zh", EnglishName: "Chinese", Name: "普通话"},
	{ISOCode: "es", EnglishName: "Spanish", Name: "Español"},
	{ISOCode: "fr", EnglishName: "French", Name: "Français"},
	{ISOCode: "de", EnglishName: "German", Name: "Deutsch"},
	{ISOCode: "it", EnglishName: "Italian", Name: "Italiano"},
	{ISOCode: "pt", EnglishName: "Portuguese", Name: "Português"},
	{ISOCode: "ru", EnglishName: "Russian", Name: "Pусский"},
	{ISOCode: "ar", EnglishName: "Arabic", Name: "العربية"},
	{ISOCode: "tr", EnglishName: "Turkish", Name: "Türkçe"},
	{ISOCode: "nl", EnglishName: "Dutch", Name: "Nederlands"},
	{ISOCode: "sv", EnglishName: "Swedish", Name: "Svenska"},
	{ISOCode: "da", EnglishName: "Danish", Name: "Dansk"},
	{ISOCode: "no", EnglishName: "Norwegian", Name: "Norsk"},
	{ISOCode: "pl", EnglishName: "Polish", Name: "Polski"},
	{ISOCode: "th", EnglishName: "Thai", Name: "ภาษาไทย"},
}

func IsValidLanguage(code string) bool {
	for _, l := range CuratedLanguages {
		if l.ISOCode == code {
			return true
		}
	}
	return false
}
