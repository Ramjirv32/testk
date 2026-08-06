$.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

$(document).ready(function(){
    $("#category-form").on("submit", function (e) {
    e.preventDefault();

    let $button = $("#add-category-btn");
    let originalText = $button.text();
    $button.prop("disabled", true).text("Loading...");

    let form = this;
    let formData = new FormData(form);

    $.ajax({
        url: "/category/store",
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
                form.reset();
                $("#imagePreview").hide();
            } else {
                toastr.error("Failed to create category.");
            }
        },
        error: function (xhr) {
            if (xhr.status === 422) {
                let errors = xhr.responseJSON.errors;
                $(".form-error").text("");
                if (errors.category_name) {
                    $(".category_name").text(errors.category_name[0]);
                }
                if (errors.description) {
                    $(".description").text(errors.description[0]);
                }
                if (errors.image) {
                    $(".category_image").text(errors.image[0]);
                }
            } else {
                toastr.error("An unexpected error occurred.");
            }
        },
        complete: function () {
            $button.prop("disabled", false).text(originalText);
        },
    });
});

$("#category_image").change(function (event) {
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
        var categoryId = $(this).data("explore-id");

        $.ajax({
            url: "/get-category-details",
            method: "GET",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: {
                category_id: categoryId,
            },
            success: function (response) {
                if (response.status === "success") {
                    window.location.href = "/category/" + categoryId;
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to fetch category details. Please try again.");
            },
        });
    });

    $(document).on("click", ".edit-category", function (e) {
        e.preventDefault();
        var categoryId = $(this).data("id");
        window.location.href = "/category/" + categoryId + "/edit";
    });

    $(document).on("click", "#update-category", function (e) {
        e.preventDefault();
        var categoryUpdateId = $(this).data("update-id");
        let form = document.getElementById("category-form");
        let formData = new FormData(form);
        formData.append("categoryUpdateId", categoryUpdateId);
        $.ajax({
            url: "/category/" + categoryUpdateId,
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

    $(document).on("click", ".delete-category", function (e) {
        e.preventDefault();
        var categoryDeleteId = $(this).data("delete-id");

        $.ajax({
            url: "/category/" + categoryDeleteId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },

            data: {
                categoryDeleteId: categoryDeleteId,
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

    $('.current-event-toggle').on('change', function () {
            const blogId = $(this).data('id');
            const status = $(this).is(':checked') ? 1 : 0;

            $.ajax({
                url: '/admin/category/update-status',
                type: 'POST',
                data: {
                    blog_id: blogId,
                    status: status
                },
                success: function (response) {
                    if (response.success) {

                    } else {
                        alert('Failed to update blog status.');
                    }
                },
                error: function () {
                    alert('Error occurred while updating status.');
                }
            });
        });
});