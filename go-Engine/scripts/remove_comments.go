package main

import (
	"bytes"
	"flag"
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/printer"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

type config struct {
	root         string
	backupExt    string
	dryRun       bool
	noBackup     bool
	restore      bool
	cleanBackups bool
}

var skipDirs = map[string]bool{
	".git":         true,
	"vendor":       true,
	"node_modules": true,
	".next":        true,
	"dist":         true,
	"build":        true,
	"tmp":          true,
}

func main() {
	cfg := parseFlags()

	var err error
	switch {
	case cfg.restore:
		err = restoreBackups(cfg)
	case cfg.cleanBackups:
		err = cleanBackups(cfg)
	default:
		err = stripComments(cfg)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func parseFlags() config {
	var cfg config
	flag.StringVar(&cfg.root, "root", ".", "root directory to process")
	flag.StringVar(&cfg.backupExt, "backup-ext", ".bak", "backup extension")
	flag.BoolVar(&cfg.dryRun, "dry-run", false, "show changes without writing")
	flag.BoolVar(&cfg.noBackup, "no-backup", false, "skip backup creation")
	flag.BoolVar(&cfg.restore, "restore", false, "restore files from backups")
	flag.BoolVar(&cfg.cleanBackups, "clean-backups", false, "delete backup files")
	flag.Parse()
	return cfg
}

func stripComments(cfg config) error {
	files, err := collectGoFiles(cfg.root)
	if err != nil {
		return err
	}

	processed := 0
	modified := 0
	for _, path := range files {
		processed++
		changed, err := processGoFile(path, cfg)
		if err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
		if changed {
			modified++
			if cfg.dryRun {
				fmt.Printf("[dry-run] would update: %s\n", path)
			} else {
				fmt.Printf("updated: %s\n", path)
			}
		}
	}

	fmt.Printf("done: processed=%d modified=%d\n", processed, modified)
	if !cfg.noBackup && !cfg.dryRun {
		fmt.Printf("backups created with extension %q\n", cfg.backupExt)
	}
	return nil
}

func processGoFile(path string, cfg config) (bool, error) {
	src, err := os.ReadFile(path)
	if err != nil {
		return false, err
	}

	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, path, src, parser.ParseComments)
	if err != nil {
		return false, err
	}

	removeCommentFields(file)
	file.Comments = nil

	var out bytes.Buffer
	printerCfg := &printer.Config{Mode: printer.UseSpaces | printer.TabIndent, Tabwidth: 8}
	if err := printerCfg.Fprint(&out, fset, file); err != nil {
		return false, err
	}

	formatted, err := format.Source(out.Bytes())
	if err != nil {
		formatted = out.Bytes()
	}

	if bytes.Equal(normalizeTrailingNewline(src), normalizeTrailingNewline(formatted)) {
		return false, nil
	}

	if cfg.dryRun {
		return true, nil
	}

	if !cfg.noBackup {
		if err := os.WriteFile(path+cfg.backupExt, src, 0644); err != nil {
			return false, err
		}
	}

	if err := os.WriteFile(path, normalizeTrailingNewline(formatted), 0644); err != nil {
		return false, err
	}

	return true, nil
}

func removeCommentFields(file *ast.File) {
	file.Doc = nil
	for _, decl := range file.Decls {
		switch d := decl.(type) {
		case *ast.GenDecl:
			d.Doc = nil
			for _, spec := range d.Specs {
				switch s := spec.(type) {
				case *ast.TypeSpec:
					s.Doc = nil
					s.Comment = nil
				case *ast.ValueSpec:
					s.Doc = nil
					s.Comment = nil
				case *ast.ImportSpec:
					s.Doc = nil
					s.Comment = nil
				}
			}
		case *ast.FuncDecl:
			d.Doc = nil
		}
	}

	ast.Inspect(file, func(node ast.Node) bool {
		switch n := node.(type) {
		case *ast.Field:
			n.Doc = nil
			n.Comment = nil
		case *ast.File:
			n.Doc = nil
		}
		return true
	})
}

func collectGoFiles(root string) ([]string, error) {
	files := make([]string, 0, 256)
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if skipDirs[d.Name()] {
				return filepath.SkipDir
			}
			return nil
		}

		if !strings.HasSuffix(path, ".go") {
			return nil
		}
		if strings.HasSuffix(path, "_test.go") {
			return nil
		}
		files = append(files, path)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return files, nil
}

func restoreBackups(cfg config) error {
	count := 0
	err := filepath.WalkDir(cfg.root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if skipDirs[d.Name()] {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(path, cfg.backupExt) {
			return nil
		}

		target := strings.TrimSuffix(path, cfg.backupExt)
		if cfg.dryRun {
			fmt.Printf("[dry-run] would restore: %s -> %s\n", path, target)
			count++
			return nil
		}

		src, readErr := os.ReadFile(path)
		if readErr != nil {
			return readErr
		}
		if writeErr := os.WriteFile(target, src, 0644); writeErr != nil {
			return writeErr
		}
		fmt.Printf("restored: %s\n", target)
		count++
		return nil
	})
	if err != nil {
		return err
	}
	fmt.Printf("done: restored=%d\n", count)
	return nil
}

func cleanBackups(cfg config) error {
	count := 0
	err := filepath.WalkDir(cfg.root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if skipDirs[d.Name()] {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(path, cfg.backupExt) {
			return nil
		}

		if cfg.dryRun {
			fmt.Printf("[dry-run] would delete backup: %s\n", path)
			count++
			return nil
		}

		if removeErr := os.Remove(path); removeErr != nil {
			return removeErr
		}
		fmt.Printf("deleted backup: %s\n", path)
		count++
		return nil
	})
	if err != nil {
		return err
	}
	fmt.Printf("done: deleted_backups=%d\n", count)
	return nil
}

func normalizeTrailingNewline(b []byte) []byte {
	trimmed := bytes.TrimRight(b, "\n")
	return append(trimmed, '\n')
}
