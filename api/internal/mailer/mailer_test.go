package mailer

import (
	"html/template"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAuthTemplatesParse(t *testing.T) {
	t.Parallel()

	templates := []string{
		"user_welcome.html",
		"token_activation.html",
		"token_password_reset.html",
	}

	for _, name := range templates {
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			_, err := template.New("email").ParseFS(templatesFs, "templates/"+name)
			require.NoError(t, err)
		})
	}
}
