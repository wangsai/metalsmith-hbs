# metalsmith-hbs

用于 Metalsmith 的 handlebars 模版插件。

此插件基于 [express-hbs](https://github.com/barc/express-hbs) 开发的，因此，大部分参数和 express-hbs 是一致的，但是默认行为会有些许不同。另外，我们还增加了 `templatesDir` 、`pattern` 和 `defaultTemplate` 参数。

## 参数用法

### `pattern`
类型：{String/Array}
默认值：`**` -- 所有文件
说明：指定允许此插件来处理文件名。正则表达式。通过 `multimatch` 来处理。

### `templatesDir`
类型：{String}
默认值：`templates`
说明：模板文件的目录名称。相对路径。默认与 `layoutsDir` 是同一个目录。通过 `metalsmith.path(templatesDir)` 获取绝对路径，也就是相对于 metalsmith 所认为的工作目录。

### `defaultTemplate`
类型：{String}
默认值：`default`
说明：默认模板文件。只需设置文件名即可，无需添加扩展名。

### `layoutsDir`
类型：{String}
默认值：`templates`
说明：存放 layout 模板文件的目录。相对路径。与 `templatesDir` 是同一个目录。通过 `metalsmith.path(layoutsDir)` 获取绝对路径，也就是相对于 metalsmith 所认为的工作目录。

### `partialsDir`

- 类型：{String}  
- 默认值：`templates/partials`
- 说明：指向 partials 目录的相对路径。

### `defaultLayout`
类型：{String}
默认值：无 -- 查找顺序的详细说明见下面 [Layout]
说明：默认 layout 模板文件名称，不带扩展名。**最好不要设置此值，尽量在模板文件内设置！**

### `handlebars`
类型：{Module}
默认值：无
说明：将用户传入的 handlebars 实例给 express-hbs 使用。

### `extname`
类型：{String}
默认值：`.hbs`
说明：所有模板文件的默认扩展名。

### `i18n`
类型：{Object}
默认值：无
说明：i18n 对象

### `blockHelperName`
- 类型：{String}
- 默认值：`block`
- 说明：自定义 `block` 助手函数的名称。

### `contentHelperName`
类型：{String}
默认值：`contentFor`
说明：自定义 `contentFor` 助手函数的名称。

### `templateOptions`
类型：{Object}
默认值：无
说明：传递给 `template()` 的额外参数。

### `beautify`
类型：{Boolean}
默认值：`false`
说明：是否重新排版 HTML 文档，请参考 github.com/einars/js-beautify .jsbeautifyrc

## `templatesDir`、`layoutsDir` 和 `partialsDir` 的关系

这三个目录分别设置了 “模板目录”、“布局文件目录"" 和 ”区块文件目录“。其中，templatesDir 是最高目录，layoutsDir 默认与 templatesDir 一致/相同，partialsDir 默认位于 templatesDir 目录的下面。

如下：

templatesDir <==> layoutsDir
|---- partialsDir


因此，只要设置了 templatesDir 就可以同时改变 layoutsDir 和 partialsDir 。


## Layout

layout 有三种使用方式，下面按照由高到低优先级列出：

1.  D在页面模板中直接声明 layout。语法如下：

        {{!< LAYOUT}}

    layout 文件的位置按如下顺序查找：

        If path 以 '.' 开头
            在当前模板所在目录寻找 LAYOUT
        Else If 设置了 `layoutsDir`
            从 `layoutsDir` 目录下寻找 LAYOUT 
        Else
            LAYOUT 按照 path.resolve(dirname(template), LAYOUT) 寻找

2.  作为参数传递给模板绘制引擎

        res.render('veggies', {
          title: 'My favorite veggies',
          veggies: veggies,
          layout: 'layout/veggie'
        });

    此参数还可以消除 layout （无论默认 layout 还是在页面的直接声明），通过为 `layout` 参数设置一个 一个求值为 false 的 JavaScript 值：

        res.render('veggies', {
          title: 'My favorite veggies',
          veggies: veggies,
          layout: null // 绘制时不适用 layout
        });

    Layout 文件的查找顺序：

        If path 以 '.' 开头
            在当前模板所在目录寻找 LAYOUT
        Else If 设置了 `layoutsDir`
            从 `layoutsDir` 目录下寻找 LAYOUT
        Else
            layout 按照 path.resolve(templatesDir, layout) 寻找

3.  最后，如果设置了 `defaultLayout` 则使用此值。

layout 可以嵌套：在任何一个 layout 文件中还可以继续声明其“父” layout，当前 layout 产生的内容最后输出到“父” layout 中。注意，不要嵌套太多，以免影响性能，尤其注意不要形成循环嵌套。 