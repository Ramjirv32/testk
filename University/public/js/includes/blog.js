$.ajaxSetup({
    headers: {
        "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
    },
});

$(document).ready(function () {
    $("#add-blog-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("blog");
        let formData = new FormData(form);

        $.ajax({
            url: "/blog",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirect_url;
                    form.reset();
                } else {
                    toastr.error("Failed to create blog post.");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                toastr.error("An error occurred. Please try again.");
            },
        });
    });

    $("#blog_image").change(function (event) {
        const file = event.target.files[0];
        const imagePreview = $("#imagePreview");
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.attr("src", e.target.result);
                imagePreview.css("display", "block");
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.attr("src", "#");
            imagePreview.css("display", "none");
        }
    });

    $("#explore-id").on("click", function () {
        var blogId = $(this).data("explore-id");

        $.ajax({
            url: "/get-blog-details",
            method: "GET",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: {
                blog_id: blogId,
            },
            success: function (response) {
                if (response.status === "success") {
                    window.location.href = "/blog/" + blogId;
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to fetch blog details. Please try again.");
            },
        });
    });

    $(document).on("click", "#edit-blog", function (e) {
        e.preventDefault();
        var blogId = $(this).data("id");
        window.location.href = "/blog/" + blogId + "/edit";
    });

    $(document).on("click", "#update-blog", function (e) {
        e.preventDefault();
        var blogUpdateId = $(this).data("update-id");
        let form = document.getElementById("blog");
        let formData = new FormData(form);
        formData.append("blogUpdateId", blogUpdateId);
        $.ajax({
            url: "/blog/" + blogUpdateId,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },

            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                formData.append("_method", "PUT");
            },
        })
            .done(function (response) {
                toastr.success(response.message);
                window.location.href = response.redirectUrl;
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to fetch blog details. Please try again.");
            });
    });

    $(document).on("click", "#delete-blog", function (e) {
        e.preventDefault();
        var blogDeleteId = $(this).data("delete-id");

        $.ajax({
            url: "/blog/" + blogDeleteId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },

            data: {
                blogDeleteId: blogDeleteId,
            },
        })
            .done(function (response) {
                toastr.success(response.message);
                window.location.href = response.redirectUrl;
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to fetch blog details. Please try again.");
            });
    });

    $(".current-event-toggle").on("change", function () {
        const blogId = $(this).data("id");
        const status = $(this).is(":checked") ? 1 : 0;

        $.ajax({
            url: "/admin/blog/update-status",
            type: "POST",
            data: {
                blog_id: blogId,
                status: status,
            },
            success: function (response) {
                if (response.success) {

                } else {
                    alert("Failed to update blog status.");
                }
            },
            error: function () {
                alert("Error occurred while updating status.");
            },
        });
    });

    const Block = Quill.import("blots/block");

    class CustomListItem extends Block {
        static create(value) {
            let node = super.create(value);
            return node;
        }

        static formats(domNode) {
            return domNode.tagName === "LI"
                ? undefined
                : super.formats(domNode);
        }
    }
    CustomListItem.blotName = "list";
    CustomListItem.tagName = "LI";
    CustomListItem.className = "my-list-item";

    const List = Quill.import("formats/list");

    class CustomList extends List {
        static create(value) {
            const tagName = value === "ordered" ? "OL" : "UL";
            let node = document.createElement(tagName);
            if (value === "bullet") {
                node.setAttribute("class", "my-custom-ul");
            }
            return node;
        }
    }

    Quill.register(CustomList, true);

    const quill = new Quill("#content-editor", {
        theme: "snow",
        modules: {
            toolbar: [
                ["bold", "italic", "underline"],
                ["link", "image", "video"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["clean"],
            ],
        },
    });

    quill.on("text-change", function () {
        const blogContent = quill.root.innerHTML;
        $("#content").val(blogContent);
    });
});
